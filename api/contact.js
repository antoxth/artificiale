// POST /api/contact — richiesta dal form contatti del sito.
// Invia: (1) notifica interna a chi gestisce, (2) auto-risposta al richiedente.
// Body: { name, email, phone, school, role, requestType, notes }

import { sendContactNotification, sendContactAutoReply } from '../lib/email.js';
import { isEmail } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const b = req.body || {};
  const data = {
    name: (b.name || '').trim(),
    email: (b.email || '').trim(),
    phone: (b.phone || '').trim(),
    school: (b.school || '').trim(),
    role: (b.role || '').trim(),
    requestType: (b.requestType || '').trim(),
    notes: (b.notes || '').trim(),
  };

  if (!data.name) return res.status(400).json({ error: 'missing_name' });
  if (!isEmail(data.email)) return res.status(400).json({ error: 'invalid_email' });

  try {
    // Notifica interna (best-effort)
    try {
      await sendContactNotification(data);
    } catch (e) {
      console.error('Notifica contatto fallita:', e);
    }

    // Auto-risposta al richiedente (best-effort)
    let replied = false;
    try {
      const r = await sendContactAutoReply({ to: data.email, name: data.name });
      replied = !(r && r.skipped);
    } catch (e) {
      console.error('Auto-risposta fallita:', e);
    }

    return res.status(200).json({ ok: true, replied });
  } catch (e) {
    console.error('POST /api/contact', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
