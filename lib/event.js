// Configurazione dell'evento (Anteprima Docenti).
// È l'UNICO punto in cui modificare i dati dello spettacolo di prova.
// Aggiorna data/ora quando saranno definite: sono usate anche per i promemoria.

export const EVENT = {
  id: 'anteprima-docenti-2026',
  title: 'Artificiale sarà lei — Anteprima Docenti',
  subtitle: 'Spettacolo di prova riservato a docenti e dirigenti scolastici',

  // ⚠️ DATA/ORA PROVVISORIE — da aggiornare quando definite.
  // Formato ISO con fuso orario italiano (+02:00 ora legale, +01:00 ora solare).
  dateISO: '2026-09-01T20:00:00+02:00',
  dateLabel: 'Data da definire — inizio settembre 2026',

  venue: 'Teatro 99 Posti — Via Traversa 91, Torelli di Mercogliano (AV)',
  capacity: 99,

  // Finestra di invio del promemoria: da quante ore prima dell'evento
  // il cron inizia a mandare i reminder (default: 48 ore prima).
  reminderHoursBefore: 48,
};
