// GET /api/reservation?code=ASL-XXXXX — dettagli di una prenotazione (per disdetta).

import { getReservationByCode } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const code = (req.query.code || '').trim();
  if (!code) return res.status(400).json({ error: 'missing_code' });

  try {
    const rows = await getReservationByCode(code);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });

    const confirmed = rows.filter((r) => r.status === 'confirmed');
    return res.status(200).json({
      code,
      name: rows[0].name,
      email: rows[0].email,
      status: confirmed.length ? 'confirmed' : 'cancelled',
      seats: confirmed.map((r) => r.seat),
    });
  } catch (e) {
    console.error('GET /api/reservation', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
