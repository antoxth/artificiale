-- Schema di riferimento (creato automaticamente da lib/db.js → ensureSchema()).
-- Riportato qui per documentazione. Non è necessario eseguirlo a mano.

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
);

-- Un posto può essere 'confirmed' una sola volta per evento.
-- I record 'cancelled' non bloccano il posto.
CREATE UNIQUE INDEX IF NOT EXISTS reservations_seat_unique
  ON reservations (event_id, seat)
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS reservations_code_idx ON reservations (code);
