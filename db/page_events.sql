-- Contatore della pagina /anteprima (ottobre 2026): visite e download dei materiali,
-- per misurare quante persone aprono il link della mail post-spettacolo.
-- È solo un'aggiunta: non tocca le tabelle reservations e waitlist.
--
-- Nessun dato personale: `visitor` è un identificativo casuale generato nel browser
-- (serve a contare i visitatori unici), `source` dice da quale mail arriva il link
-- (presenti / assenti) oppure 'diretto'.

CREATE TABLE IF NOT EXISTS page_events (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT NOT NULL,
  event       TEXT NOT NULL CHECK (event IN ('view', 'download')),
  source      TEXT NOT NULL DEFAULT 'diretto',
  visitor     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_events_page_idx ON page_events (page, created_at);

-- Come le altre tabelle: RLS attiva e nessuna policy → inaccessibile dalle API pubbliche
-- di Supabase; il sito ci accede con l'utente del database (DATABASE_URL).
ALTER TABLE page_events ENABLE ROW LEVEL SECURITY;
