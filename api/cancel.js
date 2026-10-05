// POST /api/cancel — annulla una prenotazione tramite codice. Body: { code }
// Dopo l'annullamento avvisa Antonio con un'email (best-effort: se l'email non
// parte, l'annullamento resta valido e la risposta al visitatore non cambia).

import { cancelReservation, getReservationByCode, getOccupiedSeats } from '../lib/db.js';
import { sendCancellationNotice } from '../lib/email.js';
import { EVENT } from '../lib/event.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const code = ((req.body && req.body.code) || '').trim();
  if (!code) return res.status(400).json({ error: 'missing_code' });

  try {
    // Dati letti PRIMA di annullare: servono per l'email di avviso
    const rows = (await getReservationByCode(code)).filter((r) => r.status === 'confirmed');

    const freed = await cancelReservation(code);
    if (!freed) return res.status(404).json({ error: 'not_found' });

    try {
      const first = rows[0] || {};
      const remaining = EVENT.capacity - (await getOccupiedSeats()).length;
      await sendCancellationNotice({
        code,
        name: first.name,
        email: first.email,
        phone: first.phone,
        school: first.school,
        role: first.role,
        seats: rows.map((r) => r.seat).sort((a, b) => a - b),
        remaining,
      });
    } catch (mailErr) {
      console.error('Avviso di annullamento non inviato:', mailErr);
    }

    return res.status(200).json({ ok: true, freed });
  } catch (e) {
    console.error('POST /api/cancel', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
