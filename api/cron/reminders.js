// GET /api/cron/reminders — invia i promemoria (chiamato dal Cron di Vercel).
// Invia UNA email per prenotazione ai confermati non ancora avvisati, ma solo
// quando mancano <= EVENT.reminderHoursBefore ore all'evento.

import { isCron } from '../../lib/auth.js';
import { getPendingReminders, markReminded, pingDb, checkSchema } from '../../lib/db.js';
import { sendReminder } from '../../lib/email.js';
import { EVENT } from '../../lib/event.js';

// Distanza minima tra l'inizio di un invio e il successivo: al massimo 4 al secondo,
// ben sotto il limite di Resend (10 al secondo per account, ottobre 2026).
const REMINDER_GAP_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!isCron(req)) return res.status(401).json({ error: 'unauthorized' });

  // Keep-alive del database: PRIMA di qualsiasi uscita anticipata, così il cron
  // genera attività ogni giorno e Supabase (free) non mette in pausa il progetto
  // dopo 7 giorni di inattività. Se fallisce, non blocchiamo i promemoria.
  let dbAlive = true;
  let schema = null;
  try {
    await pingDb();
    // Controllo quotidiano che tabella e indici siano al loro posto: una sola query,
    // qui e non nelle richieste degli utenti (che altrimenti rallentano).
    schema = await checkSchema();
    if (!schema.tabella || schema.indici < 2) {
      console.error('ATTENZIONE: schema del database incompleto', schema);
    }
  } catch (e) {
    dbAlive = false;
    console.error('cron keep-alive: ping DB fallito', e);
  }

  // Promemoria sospesi a mano (EVENT.remindersPaused): esce DOPO il keep-alive,
  // così il database resta sveglio, e prima di leggere o segnare qualsiasi prenotazione.
  if (EVENT.remindersPaused) {
    return res.status(200).json({ ok: true, sent: 0, reason: 'paused', dbAlive, schema });
  }

  // Finestra temporale: manda solo se l'evento è entro N ore (e non è passato).
  const now = Date.now();
  const eventTime = new Date(EVENT.dateISO).getTime();
  const hoursToEvent = (eventTime - now) / 36e5;
  if (hoursToEvent < 0 || hoursToEvent > EVENT.reminderHoursBefore) {
    return res.status(200).json({ ok: true, sent: 0, reason: 'outside_window', hoursToEvent, dbAlive, schema });
  }

  try {
    const rows = await getPendingReminders();

    // Raggruppa per codice
    const byCode = new Map();
    for (const r of rows) {
      if (!byCode.has(r.code)) {
        byCode.set(r.code, { code: r.code, name: r.name, email: r.email, seats: [] });
      }
      byCode.get(r.code).seats.push(r.seat);
    }

    // Se Resend rifiuta un invio (troppa fretta, indirizzo non valido, disservizio) risponde
    // { error } SENZA eccezione e l'email non parte. Quindi: distanziamo gli invii, ritentiamo
    // una volta se ci dice di rallentare, e segniamo "avvisato" solo chi è stato davvero
    // inviato (2/10/2026). Chi resta non segnato verrà ripreso dal cron del giorno dopo.
    let sent = 0;
    const failed = [];
    let lastStart = 0;
    const send = async (g) => {
      const wait = REMINDER_GAP_MS - (Date.now() - lastStart);
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();
      return sendReminder({ to: g.email, name: g.name, code: g.code, seats: g.seats });
    };
    for (const g of byCode.values()) {
      let r;
      try {
        r = await send(g);
        if (r?.error && (r.error.statusCode === 429 || r.error.name === 'rate_limit_exceeded')) {
          await sleep(1500);
          r = await send(g);
        }
      } catch (e) {
        r = { error: e };
      }
      if (r?.skipped) continue;
      if (!r || r.error) {
        console.error('Promemoria NON inviato', g.code, r?.error);
        failed.push(g.code);
        continue;
      }
      await markReminded(g.code);
      sent++;
    }

    return res.status(200).json({ ok: true, sent, failed, bookings: byCode.size });
  } catch (e) {
    console.error('GET /api/cron/reminders', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
