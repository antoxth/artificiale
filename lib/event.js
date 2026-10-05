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
  // `note`: riga in più sotto la distanza. `recommended: true`: etichetta "Consigliato".
  // 2/10 (indicazioni di Antonio): il parcheggio vicino NON è sotterraneo, si chiama "in prossimità
  // del teatro" e ha pochi posti; quello della chiesa è il più grande ed è il consigliato.
  parking: [
    { name: 'Parcheggio in prossimità del teatro', distance: 'a 4 metri', note: 'Pochi posti disponibili', lat: 40.9102906, lng: 14.7444656 },
    { name: 'Piazza Vecchiarelli', distance: 'a 75 metri', note: '', lat: 40.9098304, lng: 14.7438927 },
    { name: 'Parcheggio della chiesa di Torelli', distance: 'a 200 metri', note: '', recommended: true, lat: 40.9087856, lng: 14.7451459 },
    { name: 'Parcheggio del cimitero di Torelli', distance: 'a 250 metri', note: '', lat: 40.9125433, lng: 14.7450337 },
  ],

  // Prenotazioni chiuse dopo l'anteprima del 4/10: /api/reserve rifiuta nuove richieste
  // (e quindi non parte nessuna email di conferma). Per un nuovo evento: aggiornare i dati
  // qui sopra, rimettere true e togliere i redirect di /prenota, /prenotazione e /99posti
  // in vercel.json. Lo stesso flag chiude anche le iscrizioni alla lista d'attesa.
  bookingOpen: false,

  // Dove arrivano le richieste del form contatti (e reply-to delle auto-risposte).
  // Cambia in info@teatrodellescienze.it quando la casella sarà attiva.
  contactEmail: 'antoniocolucciph@gmail.com',
  // Altri indirizzi che ricevono IN COPIA le richieste del form contatti.
  // Le risposte dei docenti all'auto-risposta vanno comunque solo a contactEmail.
  // 5/10/2026: Paolo tolto TEMPORANEAMENTE per la prova del form (solo ad Antonio).
  // Per rimetterlo: contactCc: ['paolozzo63@gmail.com'].
  contactCc: [],

  // Finestra di invio del promemoria: da quante ore prima dell'evento
  // il cron inizia a mandare i reminder.
  // Il cron gira una volta al giorno alle 13:00 UTC (= 15:00–15:59 in Italia con l'ora
  // legale; il piano Hobby garantisce solo l'ora). Con 60 ore e lo spettacolo domenica
  // alle 18:30, il primo invio cade il VENERDÌ pomeriggio (a ~51 ore dall'inizio);
  // il giovedì (~75 ore) resta fuori. Se cambi data o ora dello spettacolo, ricontrolla.
  reminderHoursBefore: 60,

  // SOSPENSIONE PROMEMORIA. Con true il cron NON manda promemoria (il ping keep-alive del
  // database continua). Sospesi l'1/10/2026 mentre Antonio sistemava le prenotazioni,
  // riattivati il 3/10/2026 (invio avviato a mano: Vercel → Cron Jobs → Run), sospesi di
  // nuovo il 4/10/2026, giorno dello spettacolo: tutti avvisati, e a chi prenota in giornata
  // il promemoria non serve (indicazione di Antonio).
  remindersPaused: true,
};
