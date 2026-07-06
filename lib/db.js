// Livello dati (Postgres via @vercel/postgres).
// Un posto = una riga. Più posti nella stessa prenotazione condividono lo stesso `code`.
// Il vincolo di unicità (event_id, seat) impedisce la doppia prenotazione.

import { sql, db } from '@vercel/postgres';
import { EVENT } from './event.js';

let schemaReady = false;

// Crea tabella e indici se non esistono. Idempotente ed economica.
export async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id            SERIAL PRIMARY KEY,
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
  // Un posto può essere occupato una sola volta finché è 'confirmed'.
  // I posti 'cancelled' tornano prenotabili.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS reservations_seat_unique
    ON reservations (event_id, seat)
    WHERE status = 'confirmed'
  `;
  await sql`CREATE INDEX IF NOT EXISTS reservations_code_idx ON reservations (code)`;
  schemaReady = true;
}

// Numeri di posto già occupati (confermati) per l'evento corrente.
export async function getOccupiedSeats() {
  await ensureSchema();
  const { rows } = await sql`
    SELECT seat FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed'
  `;
  return rows.map((r) => r.seat);
}

// Crea una prenotazione (multi-posto) in modo atomico.
// Ritorna { ok:true, code } oppure { ok:false, conflict:[...] } se un posto è già preso.
export async function createReservation({ code, seats, name, email, phone, school, role, notes }) {
  await ensureSchema();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const seat of seats) {
      await client.query(
        `INSERT INTO reservations
           (code, event_id, seat, name, email, phone, school, role, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [code, EVENT.id, seat, name, email, phone || null, school || null, role || null, notes || null]
      );
    }
    await client.query('COMMIT');
    return { ok: true, code };
  } catch (e) {
    await client.query('ROLLBACK');
    if (e && e.code === '23505') {
      // Violazione unicità: almeno un posto è stato preso nel frattempo.
      return { ok: false, conflict: true };
    }
    throw e;
  } finally {
    client.release();
  }
}

// Recupera una prenotazione tramite codice (tutte le righe/posti).
export async function getReservationByCode(code) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM reservations
    WHERE code = ${code} AND event_id = ${EVENT.id}
    ORDER BY seat ASC
  `;
  return rows;
}

// Annulla una prenotazione (libera i posti).
export async function cancelReservation(code) {
  await ensureSchema();
  const { rowCount } = await sql`
    UPDATE reservations
    SET status = 'cancelled'
    WHERE code = ${code} AND event_id = ${EVENT.id} AND status = 'confirmed'
  `;
  return rowCount;
}

// Tutte le prenotazioni confermate (per admin/export), ordinate per posto.
export async function listReservations() {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed'
    ORDER BY seat ASC
  `;
  return rows;
}

// Segna/annulla il check-in di un posto.
export async function setCheckIn(seat, present) {
  await ensureSchema();
  await sql`
    UPDATE reservations
    SET checked_in_at = ${present ? new Date().toISOString() : null}
    WHERE event_id = ${EVENT.id} AND seat = ${seat} AND status = 'confirmed'
  `;
}

// Prenotazioni confermate non ancora "promemoriate", raggruppate per codice.
export async function getPendingReminders() {
  await ensureSchema();
  const { rows } = await sql`
    SELECT * FROM reservations
    WHERE event_id = ${EVENT.id} AND status = 'confirmed' AND reminded_at IS NULL
    ORDER BY code, seat ASC
  `;
  return rows;
}

export async function markReminded(code) {
  await ensureSchema();
  await sql`
    UPDATE reservations
    SET reminded_at = now()
    WHERE code = ${code} AND event_id = ${EVENT.id}
  `;
}
