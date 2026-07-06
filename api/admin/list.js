// GET /api/admin/list — elenco prenotati + conteggi (protetto da password admin).

import { isAdmin } from '../../lib/auth.js';
import { listReservations } from '../../lib/db.js';
import { EVENT } from '../../lib/event.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const rows = await listReservations();

    // Raggruppa per codice prenotazione
    const byCode = new Map();
    for (const r of rows) {
      if (!byCode.has(r.code)) {
        byCode.set(r.code, {
          code: r.code,
          name: r.name,
          email: r.email,
          phone: r.phone,
          school: r.school,
          role: r.role,
          notes: r.notes,
          created_at: r.created_at,
          seats: [],
          checkedInSeats: [],
        });
      }
      const g = byCode.get(r.code);
      g.seats.push(r.seat);
      if (r.checked_in_at) g.checkedInSeats.push(r.seat);
    }

    const bookings = [...byCode.values()].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    return res.status(200).json({
      event: { title: EVENT.title, dateLabel: EVENT.dateLabel, capacity: EVENT.capacity },
      totals: {
        seatsBooked: rows.length,
        seatsFree: EVENT.capacity - rows.length,
        bookings: bookings.length,
        checkedIn: rows.filter((r) => r.checked_in_at).length,
      },
      bookings,
    });
  } catch (e) {
    console.error('GET /api/admin/list', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
