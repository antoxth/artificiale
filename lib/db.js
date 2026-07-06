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
export async function ensureSchema() {
  if (schemaReady) return;
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
