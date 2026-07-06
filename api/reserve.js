// POST /api/reserve — crea una prenotazione (uno o più posti).
// Body JSON: { name, email, phone, school, role, notes, consent, seats:[..] }

import { isValidSeat } from '../lib/seatmap.js';
import { createReservation, getOccupiedSeats } from '../lib/db.js';
import { sendConfirmation } from '../lib/email.js';
import { genCode, isEmail } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const b = req.body || {};
  const name = (b.name || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.phone || '').trim();
  const school = (b.school || '').trim();
  const role = (b.role || '').trim();
  const notes = (b.notes || '').trim();
  const consent = b.consent === true || b.consent === 'true';
  let seats = Array.isArray(b.seats) ? b.seats.map(Number) : [];

  // Validazione
  if (!name) return res.status(400).json({ error: 'missing_name' });
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!consent) return res.status(400).json({ error: 'missing_consent' });
  if (!seats.length) return res.status(400).json({ error: 'no_seats' });

  // Dedup + validità dei numeri di posto
  seats = [...new Set(seats)];
  if (seats.some((s) => !isValidSeat(s))) {
    return res.status(400).json({ error: 'invalid_seat' });
  }

  try {
    // Pre-check gentile (per messaggio chiaro; l'atomicità la garantisce il DB)
    const occupied = new Set(await getOccupiedSeats());
    const clash = seats.filter((s) => occupied.has(s));
    if (clash.length) {
      return res.status(409).json({ error: 'seats_taken', seats: clash });
    }

    const code = genCode();
    const result = await createReservation({
      code, seats, name, email, phone, school, role, notes,
    });

    if (!result.ok && result.conflict) {
      // Qualcuno ha preso un posto tra il pre-check e l'insert.
      return res.status(409).json({ error: 'seats_taken' });
    }

    // Email di conferma (best-effort: non blocca la prenotazione)
    let emailed = false;
    try {
      const r = await sendConfirmation({ to: email, name, code, seats });
      emailed = !(r && r.skipped);
    } catch (mailErr) {
      console.error('Invio conferma fallito:', mailErr);
    }

    return res.status(200).json({ ok: true, code, seats, emailed });
  } catch (e) {
    console.error('POST /api/reserve', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
