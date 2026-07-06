# Sistema di prenotazione — Guida al setup

Sistema di prenotazione posti per l'**Anteprima Docenti** di *Artificiale sarà lei*
(Teatro 99 Posti, 99 posti, data unica, ingresso gratuito).

## Cosa fa
- Pagina pubblica **`/prenota`** con mappa interattiva dei 99 posti (disponibilità live).
- Prenotazione di uno o più posti → **email di conferma** con codice + link di disdetta.
- Pagina **`/prenotazione?code=…`** per annullare (libera i posti).
- Pagina **`/admin`** protetta da password: conteggi live, elenco prenotati, **check-in**, **export CSV**.
- **Promemoria automatico** via email (cron di Vercel) nelle ore prima dell'evento.

## Architettura
- Sito statico + **Vercel Serverless Functions** in `api/`.
- **Postgres su Supabase** per le prenotazioni (driver `postgres.js`) — vedi `lib/db.js`.
- **Resend** per le email — vedi `lib/email.js`.
- **Vercel Cron** → `api/cron/reminders.js` (schedulato in `vercel.json`).
- Piantina della sala: **`lib/seatmap.js`** (fonte unica di verità).
- Dati evento (titolo, **data/ora**, luogo): **`lib/event.js`** ← riccorreggi la data qui.

---

## Passi per andare online

### 1. Database (gratis) — Supabase
Progetto Supabase: **artificiale-sara-lei** (ref `zuymlldglrafcbytjzyl`, EU Central). La tabella `reservations` è già creata.
Prendi la stringa di connessione: Supabase → progetto → **Connect** → **Transaction pooler** (porta 6543),
sostituisci `[YOUR-PASSWORD]` con la password del database (Settings → Database → *Reset database password* se non la conosci),
e impostala su Vercel come **`DATABASE_URL`**.

### 2. Email (gratis) — Resend
1. Crea un account su [resend.com](https://resend.com) e genera una **API key**.
2. Su Vercel imposta le variabili d'ambiente:
   - `RESEND_API_KEY` = la chiave.
   - `MAIL_FROM` = mittente. **Senza dominio** (per ora): lascia `Anteprima Docenti <onboarding@resend.dev>`.
     **Con dominio** (dopo l'acquisto): verifica il dominio su Resend e usa
     `Artificiale sarà lei <anteprima@tuodominio.it>` → migliore recapito, niente spam.
   - `SITE_URL` = URL del sito (per il link di disdetta), es. `https://artificiale.vercel.app`.

> Nota: senza `RESEND_API_KEY` il sistema **funziona lo stesso** — la prenotazione va a buon fine e
> il codice è mostrato a schermo; semplicemente non parte l'email. Aggiungi la chiave quando vuoi attivarle.

### 3. Sicurezza
Imposta su Vercel:
- `ADMIN_PASSWORD` = password per accedere a `/admin`.
- `CRON_SECRET` = una stringa segreta (protegge l'endpoint dei promemoria).

### 4. Data dell'evento
Apri `lib/event.js` e imposta `dateISO` (e `dateLabel`) con la data reale.
Serve anche a far partire i promemoria nella finestra corretta (`reminderHoursBefore`, default 48h).

### 5. Deploy
Push su GitHub → Vercel builda in automatico (installa `@vercel/postgres` e `resend`).
Il cron dei promemoria è già dichiarato in `vercel.json` (gira ogni giorno alle 9:00; invia solo
quando l'evento è entro la finestra impostata).

---

## Sviluppo in locale (opzionale)
```bash
npm install
vercel env pull        # scarica le variabili dal progetto Vercel
vercel dev             # avvia sito + funzioni in locale
```

## Verifica veloce della mappa
Apri **`preview-mappa.html`** con doppio clic: mostra il layout dei 99 posti senza bisogno del server.
Utile per confermare che la disposizione coincida con la sala reale.

## Riepilogo variabili d'ambiente
Vedi `.env.example`. In sintesi: `DATABASE_URL` (Supabase), `RESEND_API_KEY`, `MAIL_FROM`,
`SITE_URL`, `ADMIN_PASSWORD`, `CRON_SECRET`.
