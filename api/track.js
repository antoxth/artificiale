// /api/track — contatore delle visite del sito: home e pagina /anteprima (materiali
// dell'Anteprima Docenti, linkata dalla mail post-spettacolo).
// Una sola funzione per tutto (il piano Hobby di Vercel limita il numero di funzioni):
//   POST { page, event:'view', source, visitor } → registra una visita (pubblico)
//   GET                                          → conteggi per il pannello admin (protetto)
//
// Le pagine mandano la visita con uno script dopo il caricamento: i sistemi antispam che
// "aprono" i link delle mail senza eseguire JavaScript non vengono contati.

import { isAdmin } from '../lib/auth.js';
import { logPageEvent, getTrafficStats } from '../lib/db.js';
import { EVENT } from '../lib/event.js';

const PAGES = ['home', 'anteprima'];
const EVENTS = ['view'];
const SOURCES = ['presenti', 'assenti'];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
    try {
      const stats = await getTrafficStats();
      return res.status(200).json({ ...stats, recipients: EVENT.anteprimaMailRecipients });
    } catch (e) {
      console.error('GET /api/track', e);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // sendBeacon può arrivare come testo: accettiamo sia JSON già letto sia stringa
  let b = req.body || {};
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch { b = {}; }
  }
  const page = String(b.page || '');
  const event = String(b.event || '');
  const source = SOURCES.includes(b.source) ? b.source : 'diretto';
  const visitor = String(b.visitor || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  if (!PAGES.includes(page) || !EVENTS.includes(event)) {
    return res.status(400).json({ error: 'invalid_event' });
  }

  try {
    await logPageEvent({ page, event, source, visitor });
    return res.status(204).end();
  } catch (e) {
    console.error('POST /api/track', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
