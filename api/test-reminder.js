// GET /api/test-reminder?code=ASL-XXXXX — TEMPORANEO (28/9/2026), da rimuovere dopo la prova.
// Manda UN promemoria di prova, e SOLO ad Antonio: il destinatario è scritto qui sotto e
// qualunque prenotazione intestata a un altro indirizzo viene rifiutata.
// Non segna la prenotazione come "già avvisata": il promemoria vero del venerdì non cambia.

import { getReservationByCode } from '../lib/db.js';
import { sendReminder } from '../lib/email.js';

const UNICO_DESTINATARIO = 'antoniocolucciph@gmail.com';

export default async function handler(req, res) {
  const code = String(req.query.code || '').trim();
  if (!code) return res.status(400).json({ error: 'missing_code' });

  try {
    const rows = await getReservationByCode(code);
    const confirmed = rows.filter((r) => r.status === 'confirmed');
    if (!confirmed.length) return res.status(404).json({ error: 'not_found' });

    if (String(confirmed[0].email).trim().toLowerCase() !== UNICO_DESTINATARIO) {
      return res.status(403).json({ error: 'solo_prenotazioni_di_antonio' });
    }

    const r = await sendReminder({
      to: UNICO_DESTINATARIO,
      name: confirmed[0].name,
      code,
      seats: confirmed.map((x) => x.seat),
    });
    return res.status(200).json({ ok: true, to: UNICO_DESTINATARIO, skipped: Boolean(r && r.skipped) });
  } catch (e) {
    console.error('GET /api/test-reminder', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
