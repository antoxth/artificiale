// Configurazione dell'evento (Anteprima Docenti).
// È l'UNICO punto in cui modificare i dati dello spettacolo.
// Aggiorna data/ora quando saranno definite: sono usate anche per i promemoria.

export const EVENT = {
  id: 'anteprima-docenti-2026',
  title: 'Artificiale sarà lei — Anteprima Docenti',
  subtitle: 'Spettacolo riservato a docenti e dirigenti scolastici',

  // Data/ora dell'evento. Formato ISO con fuso italiano (+02:00 ora legale a settembre).
  dateISO: '2026-09-20T20:00:00+02:00',
  dateLabel: '20 settembre 2026 · ore 20:00',

  venue: 'Teatro 99 Posti — Via Traversa 91, Torelli di Mercogliano (AV)',
  capacity: 99,

  // Dove arrivano le richieste del form contatti (e reply-to delle auto-risposte).
  // Cambia in info@teatrodellescienze.it quando la casella sarà attiva.
  contactEmail: 'antoniocolucciph@gmail.com',

  // Finestra di invio del promemoria: da quante ore prima dell'evento
  // il cron inizia a mandare i reminder (default: 48 ore prima).
  reminderHoursBefore: 48,
};
