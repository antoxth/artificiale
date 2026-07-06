// POST /api/admin/checkin — segna/annulla la presenza di un posto (protetto).
// Body: { seat, present:true|false }

import { isAdmin } from '../../lib/auth.js';
import { setCheckIn } from '../../lib/db.js';
import { isValidSeat } from '../../lib/seatmap.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

  const seat = Number(req.body && req.body.seat);
  const present = !(req.body && req.body.present === false);
  if (!isValidSeat(seat)) return res.status(400).json({ error: 'invalid_seat' });

  try {
    await setCheckIn(seat, present);
    return res.status(200).json({ ok: true, seat, present });
  } catch (e) {
    console.error('POST /api/admin/checkin', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
