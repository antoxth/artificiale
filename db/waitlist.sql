-- Lista d'attesa (ottobre 2026). Da eseguire UNA volta su Supabase PRIMA di pubblicare
-- il codice che la usa. È solo un'aggiunta: non tocca la tabella reservations.
--
-- Stati: in_attesa → contattato (Antonio ha mandato "si è liberato un posto")
--        → assegnato (posto dato dall'admin, conferma inviata) | rinuncia.
-- Il consenso è unico e obbligatorio: essere ricontattati per un posto liberato
-- e per future proposte dello spettacolo nella propria scuola (consent_at).

CREATE TABLE IF NOT EXISTS waitlist (
  id               BIGSERIAL PRIMARY KEY,
  event_id         TEXT NOT NULL,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  school           TEXT,
  role             TEXT,
  notes            TEXT,
  seats_requested  INTEGER NOT NULL DEFAULT 1 CHECK (seats_requested BETWEEN 1 AND 20),
  consent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status           TEXT NOT NULL DEFAULT 'in_attesa'
                   CHECK (status IN ('in_attesa', 'contattato', 'assegnato', 'rinuncia')),
  contacted_at     TIMESTAMPTZ,
  reservation_code TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_event_created_idx ON waitlist (event_id, created_at);

-- Come reservations: RLS attiva e nessuna policy → inaccessibile dalle API pubbliche
-- di Supabase; il sito ci accede con l'utente del database (DATABASE_URL).
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
