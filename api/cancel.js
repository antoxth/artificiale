// POST /api/cancel — annulla una prenotazione tramite codice. Body: { code }

import { cancelReservation } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const code = ((req.body && req.body.code) || '').trim();
  if (!code) return res.status(400).json({ error: 'missing_code' });

  try {
    const freed = await cancelReservation(code);
    if (!freed) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ ok: true, freed });
  } catch (e) {
    console.error('POST /api/cancel', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
