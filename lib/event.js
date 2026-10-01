// Configurazione dell'evento (Anteprima Docenti).
// È l'UNICO punto in cui modificare i dati dello spettacolo.
// Aggiorna data/ora quando saranno definite: sono usate anche per i promemoria.

export const EVENT = {
  id: 'anteprima-docenti-2026',
  title: 'Artificiale sarà lei — Anteprima Docenti',
  subtitle: 'Spettacolo riservato a docenti e dirigenti scolastici',

  // Data/ora dell'evento. Formato ISO con fuso italiano (+02:00 ora legale a settembre).
  dateISO: '2026-10-04T18:30:00+02:00',
  dateLabel: '4 ottobre 2026 · ore 18:30',

  venue: 'Teatro 99 Posti — Via Traversa 91, Torelli di Mercogliano (AV)',
  venueLat: 40.9102906,
  venueLng: 14.7444656,
  capacity: 99,

  // Parcheggi vicino al teatro, mostrati nell'email di promemoria.
  // Fonte: teatro99posti.com/il-teatro/dove-parcheggiare (settembre 2026).
  // Per scelta di Antonio (28/9) non si indica se un parcheggio è gratuito o a pagamento.
  // Il campo `note` resta disponibile per altre indicazioni (es. orari di apertura).
  parking: [
    { name: 'Parcheggio sotterraneo del teatro', distance: 'a 4 metri', note: '', lat: 40.9102906, lng: 14.7444656 },
    { name: 'Piazza Vecchiarelli', distance: 'a 75 metri', note: '', lat: 40.9098304, lng: 14.7438927 },
    { name: 'Parcheggio della chiesa di Torelli', distance: 'a 200 metri', note: '', lat: 40.9087856, lng: 14.7451459 },
    { name: 'Parcheggio del cimitero di Torelli', distance: 'a 250 metri', note: '', lat: 40.9125433, lng: 14.7450337 },
  ],

  // Dove arrivano le richieste del form contatti (e reply-to delle auto-risposte).
  // Cambia in info@teatrodellescienze.it quando la casella sarà attiva.
  contactEmail: 'antoniocolucciph@gmail.com',
  // Altri indirizzi che ricevono IN COPIA le richieste del form contatti.
  // Le risposte dei docenti all'auto-risposta vanno comunque solo a contactEmail.
  contactCc: ['paolozzo63@gmail.com'],

  // Finestra di invio del promemoria: da quante ore prima dell'evento
  // il cron inizia a mandare i reminder.
  // Il cron gira una volta al giorno alle 13:00 UTC (= 15:00–15:59 in Italia con l'ora
  // legale; il piano Hobby garantisce solo l'ora). Con 60 ore e lo spettacolo domenica
  // alle 18:30, il primo invio cade il VENERDÌ pomeriggio (a ~51 ore dall'inizio);
  // il giovedì (~75 ore) resta fuori. Se cambi data o ora dello spettacolo, ricontrolla.
  reminderHoursBefore: 60,

  // SOSPENSIONE PROMEMORIA (1/10/2026, richiesta di Antonio mentre sistema le prenotazioni).
  // Con true il cron NON manda promemoria (il ping keep-alive del database continua).
  // Per riattivarli: false + push. Il cron gira alle 15:00–15:59 italiane: se si riattiva
  // dopo, il primo invio è il giorno seguente (o lo si avvia a mano: Vercel → Cron Jobs → Run).
  remindersPaused: true,
};
