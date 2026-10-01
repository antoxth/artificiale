// /api/admin/waitlist — lista d'attesa nel pannello admin (protetto da password admin).
// Una sola funzione per tutto (il piano Hobby di Vercel limita il numero di funzioni):
//   GET                 → elenco iscritti + conteggi + posti liberi
//   GET ?format=csv     → CSV degli iscritti (separatore ";", si apre in Excel)
//   POST { action, id } → azioni di Antonio, ognuna avviata SOLO da un suo clic:
//     offer  : manda "si è liberato un posto" (risposte ad Antonio), stato → contattato
//     assign : { seats:[...] } crea la prenotazione, manda la conferma, stato → assegnato
//     status : { status: 'in_attesa' | 'rinuncia' } cambio manuale dello stato

import { isAdmin } from '../../lib/auth.js';
import {
  listWaitlist, getWaitlistEntry, setWaitlistStatus,
  getOccupiedSeats, createReservation,
} from '../../lib/db.js';
import { sendSeatAvailable, sendConfirmation } from '../../lib/email.js';
import { ALL_SEATS, isValidSeat } from '../../lib/seatmap.js';
import { genCode } from '../../lib/util.js';
import { EVENT } from '../../lib/event.js';

const STATUS_LABEL = {
  in_attesa: 'In attesa',
  contattato: 'Contattato',
  assegnato: 'Posto assegnato',
  rinuncia: 'Rinuncia',
};

function csvCell(v) {
  const s = String(v ?? '');
  if (/[";\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function itDate(d) {
  return d ? new Date(d).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : '';
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    if (req.method === 'GET') return await list(req, res);
    if (req.method === 'POST') return await act(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(`${req.method} /api/admin/waitlist`, e);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function list(req, res) {
  const rows = await listWaitlist();

  if (req.query && req.query.format === 'csv') {
    const header = ['N.', 'Iscritto il', 'Posti richiesti', 'Nome', 'Email', 'Telefono', 'Scuola', 'Ruolo', 'Note', 'Stato', 'Avvisato il', 'Codice prenotazione', 'Consenso ricontatto'];
    const lines = [header.join(';')];
    rows.forEach((r, i) => {
      lines.push([
        i + 1, itDate(r.created_at), r.seats_requested, r.name, r.email, r.phone, r.school, r.role, r.notes,
        STATUS_LABEL[r.status] || r.status, itDate(r.contacted_at), r.reservation_code,
        r.consent_at ? 'SI' : '',
      ].map(csvCell).join(';'));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lista-attesa-anteprima-docenti.csv"');
    return res.status(200).send('﻿' + lines.join('\r\n'));
  }

  const occupied = new Set(await getOccupiedSeats());
  const freeSeats = ALL_SEATS.filter((s) => !occupied.has(s)).sort((a, b) => a - b);
  const count = (st) => rows.filter((r) => r.status === st).length;

  return res.status(200).json({
    entries: rows.map((r, i) => ({ ...r, n: i + 1 })),
    totals: {
      in_attesa: count('in_attesa'),
      contattato: count('contattato'),
      assegnato: count('assegnato'),
      rinuncia: count('rinuncia'),
      // posti richiesti da chi è ancora in attesa o avvisato
      postiRichiesti: rows
        .filter((r) => r.status === 'in_attesa' || r.status === 'contattato')
        .reduce((s, r) => s + (Number(r.seats_requested) || 0), 0),
    },
    freeSeats,
  });
}

async function act(req, res) {
  const b = req.body || {};
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'missing_id' });

  const entry = await getWaitlistEntry(id);
  if (!entry) return res.status(404).json({ error: 'not_found' });

  if (b.action === 'offer') {
    if (!['in_attesa', 'contattato'].includes(entry.status)) {
      return res.status(409).json({ error: 'not_waiting' });
    }
    await sendSeatAvailable({ to: entry.email, name: entry.name, seatsRequested: entry.seats_requested });
    const updated = await setWaitlistStatus(id, 'contattato', { contacted: true });
    return res.status(200).json({ ok: true, entry: updated });
  }

  if (b.action === 'assign') {
    if (entry.status === 'assegnato') return res.status(409).json({ error: 'already_assigned' });

    let seats = Array.isArray(b.seats) ? [...new Set(b.seats.map(Number))] : [];
    if (!seats.length) return res.status(400).json({ error: 'no_seats' });
    if (seats.some((s) => !isValidSeat(s))) return res.status(400).json({ error: 'invalid_seat' });
    seats.sort((a, c) => a - c);

    const occupied = new Set(await getOccupiedSeats());
    const taken = seats.filter((s) => occupied.has(s));
    if (taken.length) return res.status(409).json({ error: 'seats_taken', seats: taken });

    const code = genCode();
    const result = await createReservation({
      code, seats,
      name: entry.name, email: entry.email, phone: entry.phone,
      school: entry.school, role: entry.role,
      notes: ['Dalla lista d\'attesa', entry.notes].filter(Boolean).join(' — '),
    });
    if (!result.ok && result.conflict) return res.status(409).json({ error: 'seats_taken' });

    // Prima segno l'assegnazione, poi la conferma: se l'email fallisse il posto resta assegnato.
    const updated = await setWaitlistStatus(id, 'assegnato', { reservationCode: code });
    let emailed = false;
    try {
      const r = await sendConfirmation({ to: entry.email, name: entry.name, code, seats });
      emailed = !(r && r.skipped);
    } catch (e) {
      console.error('Conferma dopo assegnazione non inviata:', e);
    }
    return res.status(200).json({ ok: true, code, seats, emailed, entry: updated });
  }

  if (b.action === 'status') {
    if (!['in_attesa', 'rinuncia'].includes(b.status)) return res.status(400).json({ error: 'invalid_status' });
    if (entry.status === 'assegnato') return res.status(409).json({ error: 'already_assigned' });
    const updated = await setWaitlistStatus(id, b.status);
    return res.status(200).json({ ok: true, entry: updated });
  }

  return res.status(400).json({ error: 'invalid_action' });
}
