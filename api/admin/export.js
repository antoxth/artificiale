// GET /api/admin/export — scarica il CSV dei prenotati (protetto).
// Una riga per posto: pronto per gestire la sala all'ingresso.
// CSV con separatore ";" e BOM UTF-8 → si apre correttamente in Excel italiano.

import { isAdmin } from '../../lib/auth.js';
import { listReservations } from '../../lib/db.js';

function csvCell(v) {
  const s = String(v ?? '');
  if (/[";\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const rows = await listReservations(); // ordinate per posto
    const header = ['Posto', 'Nome', 'Email', 'Telefono', 'Scuola', 'Ruolo', 'Codice', 'Check-in', 'Note'];
    const lines = [header.join(';')];

    for (const r of rows) {
      lines.push(
        [
          r.seat,
          r.name,
          r.email,
          r.phone,
          r.school,
          r.role,
          r.code,
          r.checked_in_at ? 'PRESENTE' : '',
          r.notes,
        ]
          .map(csvCell)
          .join(';')
      );
    }

    const csv = '﻿' + lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="prenotati-anteprima-docenti.csv"');
    return res.status(200).send(csv);
  } catch (e) {
    console.error('GET /api/admin/export', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
