// Livello dati (Postgres su Supabase, via postgres.js).
// Un posto = una riga. Più posti nella stessa prenotazione condividono lo stesso `code`.
// L'indice unico parziale (event_id, seat) WHERE status='confirmed' impedisce la doppia prenotazione.
//
// Connessione: usa DATABASE_URL con il POOLER "transaction" di Supabase (porta 6543).
// Per il pooler transaction è obbligatorio prepare:false.

import postgres from 'postgres';
import { EVENT } from './event.js';

let _sql;
function db() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL non configurata');
    }
    _sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      prepare: false, // richiesto dal pooler "transaction" di Supabase (porta 6543)
      max: 1, // serverless: poche connessioni per istanza
      idle_timeout: 20,
    });
  }
  return _sql;
}

let schemaReady = false;
// Rete di sicurezza: crea tabella/indici se mancano. Idempotente (di norma già creati dalla migration).
//
// DISATTIVATA di default dal 18/9/2026: tabella e indici esistono da luglio (db/schema.sql),
// e queste 3 istruzioni partivano a ogni "risveglio" della funzione, aggiungendo tre viaggi
// di rete prima di ogni risposta (l'admin ci metteva secondi ad aprirsi).
// Per riattivarla — es. su un database nuovo e vuoto — impostare DB_ENSURE_SCHEMA=1 su Vercel.
export async function ensureSchema() {
  if (schemaReady) return;
  if (process.env.DB_ENSURE_SCHEMA !== '1') {
    schemaReady = true;
    return;
  }
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id            BIGSERIAL PRIMARY KEY,
      code          TEXT NOT NULL,
      event_id      TEXT NOT NULL,
      seat          INTEGER NOT NULL,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT,
      school        TEXT,
      role          TEXT,
      notes         TEXT,
      status        TEXT NOT NULL DEFAULT 'confirmed',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      reminded_at   TIMESTAMPTZ,
      checked_in_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS reservations_seat_unique
    ON reservations (event_id, seat) WHERE status = 'confirmed'
  `;
  await sql`CREATE INDEX IF NOT EXISTS reservations_code_idx ON reservations (code)`;
  schemaReady = true;
}

// Controllo di integrità: verifica con UNA sola query che tabella e indici ci siano ancora.
// Sostituisce il vecchio controllo che girava a ogni richiesta degli utenti: lo esegue
// il cron una volta al giorno, così nessuno aspetta. Ritorna { tabella, indici }.
export async function checkSchema() {
  const sql = db();
  const [row] = await sql`
    SELECT to_regclass('public.reservations') IS NOT NULL AS tabella,
           (SELECT count(*) FROM pg_indexes
             WHERE tablename = 'reservations'
               AND indexname IN ('reservations_seat_unique', 'reservations_code_idx')) AS indici
  `;
  return { tabella: row?.tabella === true, indici: Number(row?.indici ?? 0) };
}

// Keep-alive: query minima per generare attività sul database.
// Serve perché Supabase (piano free) mette in pausa il progetto dopo 7 giorni
// senza richieste, e con il progetto in pausa la pagina prenotazioni va in 500.
// Chiamata ogni giorno dal cron dei promemoria.
export async function pingDb() {
  const sql = db();
  const [row] = await sql`SELECT 1 AS ok`;
  return row?.ok === 1;
}

// Numeri di posto già occupati (confermati) per l'evento corrente.
export async function getOccupiedSeats() {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT seat FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed'
  `;
  return rows.map((r) => r.seat);
}

// Crea una prenotazione (multi-posto) in modo atomico.
// Ritorna { ok:true, code } oppure { ok:false, conflict:true } se un posto è già preso.
export async function createReservation({ code, seats, name, email, phone, school, role, notes }) {
  await ensureSchema();
  const sql = db();
  try {
    await sql.begin(async (tx) => {
      for (const seat of seats) {
        await tx`
          INSERT INTO reservations
            (code, event_id, seat, name, email, phone, school, role, notes)
          VALUES
            (${code}, ${EVENT.id}, ${seat}, ${name}, ${email},
             ${phone || null}, ${school || null}, ${role || null}, ${notes || null})
        `;
      }
    });
    return { ok: true, code };
  } catch (e) {
    if (e && e.code === '23505') {
      // Violazione unicità: almeno un posto è stato preso nel frattempo.
      return { ok: false, conflict: true };
    }
    throw e;
  }
}

// Recupera una prenotazione tramite codice (tutte le righe/posti).
export async function getReservationByCode(code) {
  await ensureSchema();
  const sql = db();
  return sql`
    SELECT * FROM reservations
    WHERE code = ${code} AND event_id = ${EVENT.id}
    ORDER BY seat ASC
  `;
}

// Annulla una prenotazione (libera i posti). Ritorna il numero di posti liberati.
export async function cancelReservation(code) {
  await ensureSchema();
  const sql = db();
  const res = await sql`
    UPDATE reservations SET status = 'cancelled'
    WHERE code = ${code} AND event_id = ${EVENT.id} AND status = 'confirmed'
  `;
  return res.count;
}

// Tutte le prenotazioni confermate (per admin/export), ordinate per posto.
export async function listReservations() {
  await ensureSchema();
  const sql = db();
  return sql`
    SELECT * FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed'
    ORDER BY seat ASC
  `;
}

// Segna/annulla il check-in di un posto.
export async function setCheckIn(seat, present) {
  await ensureSchema();
  const sql = db();
  await sql`
    UPDATE reservations
    SET checked_in_at = ${present ? new Date() : null}
    WHERE event_id = ${EVENT.id} AND seat = ${seat} AND status = 'confirmed'
  `;
}

// Prenotazioni confermate non ancora "promemoriate", raggruppate per codice.
export async function getPendingReminders() {
  await ensureSchema();
  const sql = db();
  return sql`
    SELECT * FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed' AND reminded_at IS NULL
    ORDER BY code, seat ASC
  `;
}

export async function markReminded(code) {
  const sql = db();
  await sql`
    UPDATE reservations SET reminded_at = now()
    WHERE code = ${code} AND event_id = ${EVENT.id}
  `;
}

// ---- Lista d'attesa (tabella waitlist, vedi db/waitlist.sql) ----

// Iscritti "attivi": ancora in attesa o già contattati per un posto liberato.
const WAITLIST_ACTIVE = ['in_attesa', 'contattato'];

// Quanti iscritti attivi ci sono. Se la tabella non esiste ancora (codice pubblicato
// prima della migrazione) risponde 0, così la pagina di prenotazione non si rompe.
export async function countActiveWaitlist() {
  const sql = db();
  try {
    const [row] = await sql`
      SELECT count(*)::int AS n FROM waitlist
      WHERE event_id = ${EVENT.id} AND status IN ${sql(WAITLIST_ACTIVE)}
    `;
    return row?.n ?? 0;
  } catch (e) {
    if (e && e.code === '42P01') return 0; // tabella mancante
    throw e;
  }
}

// Posti richiesti in totale dagli iscritti attivi.
export async function sumActiveSeatsRequested() {
  const sql = db();
  const [row] = await sql`
    SELECT coalesce(sum(seats_requested), 0)::int AS n FROM waitlist
    WHERE event_id = ${EVENT.id} AND status IN ${sql(WAITLIST_ACTIVE)}
  `;
  return row?.n ?? 0;
}

// Iscrive alla lista d'attesa. Se la stessa email è già iscritta e attiva non crea
// un doppione: ritorna { entry, already: true } (e il chiamante non rimanda le email).
export async function addToWaitlist({ name, email, phone, school, role, notes, seatsRequested }) {
  const sql = db();
  const [existing] = await sql`
    SELECT * FROM waitlist
    WHERE event_id = ${EVENT.id} AND lower(email) = lower(${email})
      AND status IN ${sql(WAITLIST_ACTIVE)}
    ORDER BY created_at LIMIT 1
  `;
  if (existing) return { entry: existing, already: true };

  const [entry] = await sql`
    INSERT INTO waitlist (event_id, name, email, phone, school, role, notes, seats_requested)
    VALUES (${EVENT.id}, ${name}, ${email}, ${phone || null}, ${school || null},
            ${role || null}, ${notes || null}, ${seatsRequested})
    RETURNING *
  `;
  return { entry, already: false };
}

// Tutti gli iscritti, in ordine di iscrizione (per l'admin e il CSV).
export async function listWaitlist() {
  const sql = db();
  return sql`
    SELECT * FROM waitlist WHERE event_id = ${EVENT.id}
    ORDER BY created_at ASC, id ASC
  `;
}

export async function getWaitlistEntry(id) {
  const sql = db();
  const [row] = await sql`SELECT * FROM waitlist WHERE id = ${id} AND event_id = ${EVENT.id}`;
  return row || null;
}

// Aggiorna lo stato di un iscritto. `contacted` registra l'ora dell'avviso;
// `reservationCode` collega la prenotazione creata dall'assegnazione.
export async function setWaitlistStatus(id, status, { contacted = false, reservationCode = null } = {}) {
  const sql = db();
  const setContacted = contacted ? sql`, contacted_at = now()` : sql``;
  const setCode = reservationCode ? sql`, reservation_code = ${reservationCode}` : sql``;
  const [row] = await sql`
    UPDATE waitlist SET status = ${status} ${setContacted} ${setCode}
    WHERE id = ${id} AND event_id = ${EVENT.id}
    RETURNING *
  `;
  return row || null;
}

// ---- Contatore visite del sito (tabella page_events, vedi db/page_events.sql) ----
// Pagine contate: 'home' (index.html) e 'anteprima' (materiali dell'Anteprima Docenti).

export async function logPageEvent({ page, event, source, visitor }) {
  const sql = db();
  await sql`
    INSERT INTO page_events (page, event, source, visitor)
    VALUES (${page}, ${event}, ${source}, ${visitor || null})
  `;
}

// Visualizzazioni (aperture, anche ripetute) e visitatori unici (identificativo casuale
// del browser): per tutto il sito, per pagina e, per /anteprima, per provenienza
// (mail ai presenti / mail agli assenti / diretto).
export async function getTrafficStats() {
  const sql = db();
  const [site] = await sql`
    SELECT count(*)::int AS views, count(DISTINCT visitor)::int AS visitors, max(created_at) AS last_at
    FROM page_events WHERE event = 'view'
  `;
  const byPage = await sql`
    SELECT page, count(*)::int AS views, count(DISTINCT visitor)::int AS visitors
    FROM page_events WHERE event = 'view'
    GROUP BY page
  `;
  const anteprimaBySource = await sql`
    SELECT source, count(*)::int AS views, count(DISTINCT visitor)::int AS visitors
    FROM page_events WHERE event = 'view' AND page = 'anteprima'
    GROUP BY source
  `;
  return { site, byPage, anteprimaBySource };
}
