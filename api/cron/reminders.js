// GET /api/cron/reminders — invia i promemoria (chiamato dal Cron di Vercel).
// Invia UNA email per prenotazione ai confermati non ancora avvisati, ma solo
// quando mancano <= EVENT.reminderHoursBefore ore all'evento.

import { isCron } from '../../lib/auth.js';
import { getPendingReminders, markReminded } from '../../lib/db.js';
import { sendReminder } from '../../lib/email.js';
import { EVENT } from '../../lib/event.js';

export default async function handler(req, res) {
  if (!isCron(req)) return res.status(401).json({ error: 'unauthorized' });

  // Finestra temporale: manda solo se l'evento è entro N ore (e non è passato).
  const now = Date.now();
  const eventTime = new Date(EVENT.dateISO).getTime();
  const hoursToEvent = (eventTime - now) / 36e5;
  if (hoursToEvent < 0 || hoursToEvent > EVENT.reminderHoursBefore) {
    return res.status(200).json({ ok: true, sent: 0, reason: 'outside_window', hoursToEvent });
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

    let sent = 0;
    for (const g of byCode.values()) {
      const r = await sendReminder({ to: g.email, name: g.name, code: g.code, seats: g.seats });
      // Segna come avvisato solo se l'email è partita davvero (non skipped)
      if (!(r && r.skipped)) {
        await markReminded(g.code);
        sent++;
      }
    }

    return res.status(200).json({ ok: true, sent, bookings: byCode.size });
  } catch (e) {
    console.error('GET /api/cron/reminders', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
