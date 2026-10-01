// GET /api/seats — layout della sala + posti occupati + info evento.
// Il client usa questa risposta per disegnare la mappa e marcare gli occupati.

import { SEATMAP, SEAT_NOTES } from '../lib/seatmap.js';
import { EVENT } from '../lib/event.js';
import { getOccupiedSeats, countActiveWaitlist } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const occupied = await getOccupiedSeats();
    const remaining = EVENT.capacity - occupied.length;
    // Modalità lista d'attesa: posti finiti, oppure c'è già qualcuno in attesa
    // (i posti che si liberano li assegna Antonio a chi aspetta, non il primo che passa).
    const waitlist = remaining <= 0 || (await countActiveWaitlist()) > 0;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      event: {
        title: EVENT.title,
        subtitle: EVENT.subtitle,
        dateLabel: EVENT.dateLabel,
        venue: EVENT.venue,
        capacity: EVENT.capacity,
      },
      seatmap: SEATMAP,
      notes: SEAT_NOTES,
      occupied,
      remaining,
      waitlist,
    });
  } catch (e) {
    console.error('GET /api/seats', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
