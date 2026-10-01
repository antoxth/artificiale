// GET /api/resend-confirmation — TEMPORANEO (1/10/2026), da rimuovere subito dopo l'uso.
// Rimanda la conferma di UNA sola prenotazione (ASL-AH9VR) a UN solo indirizzo
// (Ciro Perrelli), con il nome "Ciro" al posto di "Ciro (Antonio Colucci)".
// Codice e destinatario sono scritti qui: nessun parametro esterno li cambia.

import { getReservationByCode } from '../lib/db.js';
import { sendConfirmation } from '../lib/email.js';

const CODICE = 'ASL-AH9VR';
const DESTINATARIO = 'perrelliciro@gmail.com';
const NOME_NELLA_MAIL = 'Ciro';

export default async function handler(req, res) {
  try {
    const rows = (await getReservationByCode(CODICE)).filter((r) => r.status === 'confirmed');
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    if (String(rows[0].email).trim().toLowerCase() !== DESTINATARIO) {
      return res.status(409).json({ error: 'email_della_prenotazione_cambiata' });
    }

    const r = await sendConfirmation({
      to: DESTINATARIO,
      name: NOME_NELLA_MAIL,
      code: CODICE,
      seats: rows.map((x) => x.seat).sort((a, b) => a - b),
    });
    return res.status(200).json({ ok: true, to: DESTINATARIO, skipped: Boolean(r && r.skipped) });
  } catch (e) {
    console.error('GET /api/resend-confirmation', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
