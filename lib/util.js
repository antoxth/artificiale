// Utility condivise.

// Genera un codice prenotazione leggibile, es. "ASL-7F3K9".
// Niente caratteri ambigui (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function genCode() {
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `ASL-${s}`;
}

export function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Escape minimale per iniettare testo utente dentro l'HTML delle email.
export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Formatta la data evento in italiano leggibile.
export function formatEventDate(dateISO) {
  try {
    const d = new Date(dateISO);
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome',
    }).format(d);
  } catch {
    return dateISO;
  }
}
