// POST /api/waitlist — iscrizione alla lista d'attesa (posti esauriti).
// Body: { name, email, phone, school, role, notes, seatsRequested, consent }
// Manda subito: conferma a chi si iscrive + avviso ad Antonio (best-effort: se le email
// non partono l'iscrizione resta valida). Una stessa email attiva non viene duplicata.

import { addToWaitlist, countActiveWaitlist, sumActiveSeatsRequested, getOccupiedSeats } from '../lib/db.js';
import { sendWaitlistConfirmation, sendWaitlistNotice } from '../lib/email.js';
import { EVENT } from '../lib/event.js';
import { isEmail } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Evento concluso: niente iscrizioni e nessuna email (come /api/reserve)
  if (!EVENT.bookingOpen) {
    return res.status(410).json({ error: 'booking_closed' });
  }

  const b = req.body || {};
  const data = {
    name: String(b.name || '').trim(),
    email: String(b.email || '').trim(),
    phone: String(b.phone || '').trim(),
    school: String(b.school || '').trim(),
    role: String(b.role || '').trim(),
    notes: String(b.notes || '').trim(),
    seatsRequested: Number(b.seatsRequested),
  };
  const consent = b.consent === true || b.consent === 'true';

  if (!data.name) return res.status(400).json({ error: 'missing_name' });
  if (!isEmail(data.email)) return res.status(400).json({ error: 'invalid_email' });
  if (!Number.isInteger(data.seatsRequested) || data.seatsRequested < 1 || data.seatsRequested > 20) {
    return res.status(400).json({ error: 'invalid_seats_requested' });
  }
  if (!consent) return res.status(400).json({ error: 'missing_consent' });

  try {
    // La lista è aperta solo quando i posti sono finiti (o c'è già qualcuno in attesa):
    // se nel frattempo ci sono posti prenotabili, la pagina deve tornare alla mappa.
    const remaining = EVENT.capacity - (await getOccupiedSeats()).length;
    const active = await countActiveWaitlist();
    if (remaining > 0 && active === 0) {
      return res.status(409).json({ error: 'seats_available' });
    }

    const { entry, already } = await addToWaitlist(data);

    if (!already) {
      const position = await countActiveWaitlist();
      const seatsTotal = await sumActiveSeatsRequested();
      try {
        await sendWaitlistConfirmation({ to: entry.email, name: entry.name, seatsRequested: entry.seats_requested });
      } catch (e) {
        console.error('Conferma lista d\'attesa non inviata:', e);
      }
      try {
        await sendWaitlistNotice({ ...data, position, seatsTotal });
      } catch (e) {
        console.error('Avviso lista d\'attesa ad Antonio non inviato:', e);
      }
    }

    return res.status(200).json({ ok: true, already });
  } catch (e) {
    console.error('POST /api/waitlist', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
