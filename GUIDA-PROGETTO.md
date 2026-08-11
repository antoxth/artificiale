# Guida al progetto — "Artificiale sarà lei"

> **Scopo di questo file.** Spiegare l'intero sito a chi ci rimetterà mano in futuro
> (umano o modello AI), così da poter intervenire in fretta e senza rompere nulla.
> Leggilo tutto prima di modificare. È scritto in italiano di proposito.

---

## 1. Cos'è il progetto

Sito web + sistema di prenotazione per **"Artificiale sarà lei"**, una
**lezione-spettacolo sull'Intelligenza Artificiale** prodotta dalla compagnia
**Teatro delle Scienze** (nata nel Dipartimento di Matematica dell'Università di Salerno,
progetto Liceo Matematico).

Il sito ha due parti:
1. **Home page vetrina** (`index.html`) — presenta lo spettacolo a scuole, docenti, genitori.
2. **Sistema di prenotazione** dell'**Anteprima Docenti** (pagine `/prenota`, `/prenotazione`, `/admin`)
   con mappa posti, email di conferma e promemoria automatici.

- **Dominio di produzione:** `www.teatrodellescienze.it` (registrato su **Register.it**).
- **Hosting / deploy:** **Vercel** (deploy automatico da GitHub, branch `main`).
- **Repo GitHub:** `github.com/antoxth/artificiale`.
- **Cartella di lavoro locale:** `~/Desktop/artificiale-sara-lei`.

---

## 2. Stack tecnologico

| Ambito | Tecnologia |
|---|---|
| Frontend | **HTML/CSS/JS statici** (nessun framework, nessun build step) |
| Font | **Inter** (testo) + **Zilla Slab** (titoli), da Google Fonts |
| Icone | Font Awesome 6 (via CDN) |
| Backend | **Vercel Serverless Functions** in `api/` (Node.js, ES modules) |
| Database | **Postgres su Supabase** (driver `postgres.js`) — solo per le prenotazioni |
| Email | **Resend** (`lib/email.js`) |
| Cron | **Vercel Cron** → promemoria email (`api/cron/reminders.js`) |

Il frontend **non ha dipendenze npm**. Le uniche dipendenze (`postgres`, `resend`) servono
solo alle funzioni serverless. `package.json` ha `"type": "module"`.

---

## 3. Mappa dei file

```
artificiale-sara-lei/
├── index.html            ← HOME PAGE (il file che si tocca più spesso)
├── style.css             ← TUTTO lo stile della home (~44 KB, un unico file)
├── app.js                ← JS della home (menu, gallery, lightbox, player audio, form contatti)
│
├── prenota.html          ← pagina prenotazione posti (mappa + form)
├── assets/prenota.css    ← stile delle pagine di prenotazione/admin
├── assets/prenota.js     ← logica mappa posti + invio prenotazione
├── prenotazione.html     ← pagina di disdetta (link nelle email)
├── admin.html            ← pannello admin (conteggi, check-in, export) — protetto da password
├── assets/admin.js       ← logica del pannello admin
├── preview-mappa.html    ← anteprima della piantina posti (apribile con doppio clic, senza server)
│
├── api/                  ← funzioni serverless (girano SOLO su Vercel, non sul server locale)
│   ├── seats.js          ← stato posti (liberi/occupati) + dati evento
│   ├── reserve.js        ← crea una prenotazione
│   ├── reservation.js    ← legge una prenotazione da codice
│   ├── cancel.js         ← annulla una prenotazione
│   ├── contact.js        ← invio del form contatti della home
│   ├── admin/            ← list.js, checkin.js, export.js (dietro password)
│   └── cron/reminders.js ← promemoria email + ping keep-alive del DB (Vercel Cron, ogni giorno alle 9:00)
│
├── .github/workflows/
│   └── keepalive.yml     ← chiama /api/seats ogni 6h per non far addormentare Supabase
│
├── lib/                  ← logica condivisa dalle funzioni
│   ├── event.js          ← ★ DATI DELL'EVENTO (data, ora, luogo, capienza, email) — punto UNICO
│   ├── seatmap.js        ← disposizione dei 99 posti (fonte unica di verità della piantina)
│   ├── db.js             ← connessione Postgres/Supabase
│   ├── email.js          ← template e invio email (Resend)
│   ├── auth.js           ← password admin
│   └── util.js           ← utilità varie
│
├── db/schema.sql         ← schema tabella `reservations`
├── assets/               ← immagini, audio, loghi, font, materiali.zip
│   ├── gallery/          ← foto usate nella sezione Galleria
│   ├── audio/            ← brani della sezione Musiche (+ metadata.json)
│   ├── logo-*.svg/.jpg   ← loghi header e partner
│   └── materiali.zip     ← ZIP scaricabile dalla home (brochure + locandina)
│
├── vercel.json           ← config Vercel (cleanUrls + cron)
├── package.json          ← dipendenze serverless
├── .env.example          ← elenco delle variabili d'ambiente (senza valori)
├── sitemap.xml, robots.txt
├── SETUP-PRENOTAZIONI.md ← guida dettagliata al setup del sistema di prenotazione
└── GUIDA-PROGETTO.md     ← questo file
```

**File NON versionati** (in `.gitignore`, restano solo in locale): `.env`, `foto/`,
`audio-e-canzoni/`, `riassunto.md`, `scratch/`, vari PDF/immagini sorgente sparsi nella root
(es. `copione IA per 2 attori.docx.pdf`, `brochure_Artificiale_sara_lei .pdf`).
I file "sorgente" sparsi nella root (brochure, locandine, IMG_*) **non fanno parte del sito**:
servono come materiale di partenza. Non referenziarli dalle pagine.

---

## 4. La HOME PAGE sezione per sezione

`index.html` è una singola pagina con queste `<section>` (in ordine). La colonna "menu"
indica se compare nella navbar in alto.

| # | `id` sezione | classe | Contenuto | Nel menu? |
|---|---|---|---|---|
| 1 | `home` | `hero-section` | Titolo, sottotitolo, **credits** (di/con/consulenza/resp.), foto, CTA Prenota | Home |
| 2 | `che-cose` | `checose-section` | "Cos'è" — due colonne: *Una Lezione* / *Uno Spettacolo* | no |
| 3 | `didattica` | `didattica-section` | "Perché a scuola" — foto + **statistiche** + take-away + box citazione | Perché a Scuola |
| 4 | `a-chi-si-rivolge` | `rivolge-section` | "A chi si rivolge" — intro + box *Non solo licei* + *Quali scuole* | no |
| 5 | `trailer` | `trailer-section` | Video trailer (bottone play) | Trailer |
| 6 | `galleria` | `gallery-section` | Carosello foto (`assets/gallery/`) + lightbox | Galleria |
| 7 | *(nessuno)* | `interattivita-section` | Blocco "Rete Neurale" / interattività | no |
| 8 | `playlist` | `playlist-section` | "Musiche" — player brani (`assets/audio/`) | Musiche |
| 9 | `chi-siamo` | `didattica-section` | Due schede: *Teatro delle Scienze* / *Progetto Liceo Matematico* + tagline | Chi siamo |
| 10 | *(nessuno)* | `partners-section` | Loghi partner (DipMat UNISA, Liceo Matematico, Teatro 99 Posti) | no |
| 11 | `contatti` | `contatti-section` | Blocco download materiali + form contatti + CTA Prenota | no |
| 12 | footer | `footer` | Contatti, crediti, link | no |

**Menu (navbar):** definito in `index.html` intorno alla riga 92. L'ordine delle voci deve
rispecchiare l'ordine delle sezioni. Il pulsante **Prenota** apre `/prenota` in **nuova scheda**
(`target="_blank"`).

---

## 5. Design system (stile)

Tutti i colori e i font sono **variabili CSS** in cima a `style.css` (blocco `:root`). Usale
sempre invece di valori hardcoded.

```css
--color-primary:      #B5903B   /* oro/ocra — colore brand principale */
--color-primary-dark: #8F6F2C   /* ocra scuro (testo su fondo chiaro, hover) */
--color-primary-light:#FBF7EC   /* ocra leggerissimo (sfondo box) */
--color-bg-light:     #FFFFFF
--color-bg-alt:       #F8FAFC   /* grigio ghiaccio (sfondi alternati) */
--color-bg-dark:      #121212   /* footer / box scuri */
--color-text-dark:    #1A1A1A
--color-text-muted:   #64748B
--color-border:       #E2E8F0
--font-primary: 'Inter', sans-serif      /* corpo del testo */
--font-display: 'Zilla Slab', serif      /* titoli */
--shadow-subtle / --shadow-medium / --shadow-gold
--transition-smooth
```

**Convenzioni di stile già in uso:**
- Titoli di sezione: `.section-title` (con sottolineatura oro).
- Grassetti dentro i testi: `<strong>` viene reso in **oro scuro** (`--color-primary-dark`).
- Box informativi: sfondo `--color-primary-light`, bordo, spesso `border-left: 5px solid var(--color-primary)`.
- Layout responsive: media query principale a `max-width: 720px` in fondo a `style.css`;
  le griglie a 2 colonne diventano 1 colonna su mobile.

---

## 6. Come lavorare in locale (workflow collaudato)

### 6.1 Anteprima veloce del frontend (senza backend)
La home è statica: basta un server statico.

```bash
cd ~/Desktop/artificiale-sara-lei
python3 -m http.server 8000 --bind 127.0.0.1
# poi apri http://localhost:8000/
```

⚠️ Con questo server **NON funzionano**: le API (`/api/...`) e i "clean URL"
(`/prenota` → `prenota.html`). Vanno bene solo per vedere/modificare la **home**.
Per aprire la pagina prenotazione in locale usa direttamente `http://localhost:8000/prenota.html`.

### 6.2 Anteprima completa (con backend e API)
```bash
npm install
vercel env pull     # scarica le variabili d'ambiente dal progetto Vercel
vercel dev          # sito + funzioni serverless in locale
```

### 6.3 ★ Cache del CSS — regola importante
`index.html` carica il CSS con un **numero di versione**:
`<link rel="stylesheet" href="style.css?v=2.0">`.
Il browser mette in cache quell'URL: **ogni volta che modifichi `style.css` devi alzare
il numero** (`?v=2.0` → `?v=2.1`), altrimenti l'utente (e tu) continuate a vedere il vecchio stile.
Stessa logica per i loghi/immagini che cambiano (es. `logo-teatro-scienze.svg?v=2`).
In locale, ricorda anche l'hard-refresh: **Cmd+Shift+R**.

### 6.4 Verifica visiva (opzionale ma consigliata)
Per controllare com'è venuta una sezione senza aprire il browser a mano, si può renderizzare
la pagina headless con Chrome. Le animazioni "scroll-reveal" nascondono i contenuti finché non
scrolli: per aggirarle si inietta questo `<style>` prima di `</head>` in una copia temporanea:

```html
<style>#lightbox{display:none!important}
*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}</style>
```

Poi: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu
--screenshot=out.png --window-size=1280,9600 "http://127.0.0.1:8000/copia-temporanea.html"`
e si ritaglia la sezione desiderata. (Serve `poppler`/PIL per i ritagli; installabili con `brew install poppler`.)

---

## 7. Deploy in produzione

1. Fai le modifiche in locale e verificale.
2. **Commit + push su `main`** →

```bash
git add <file modificati>
git commit -m "messaggio"
git push origin main
```

3. **Vercel builda e pubblica in automatico** (di solito 1–2 minuti). Poi controlla
   `www.teatrodellescienze.it`.

**Convenzioni git di questo progetto:**
- Si lavora direttamente su `main`.
- Si accumulano più modifiche in locale e si fa **un push unico** quando è tutto pronto
  (il proprietario di solito dice esplicitamente "fai il push").
- ⚠️ **Non committare la cancellazione di `assets/gallery/foto_15.jpg`**: il file è ancora
  referenziato in `index.html` (Galleria). Se in locale risulta "eliminato", **non** mettere in
  stage quella cancellazione, altrimenti la galleria si rompe in produzione.
- Non committare i file sorgente sparsi nella root (brochure, locandine, IMG_*): non servono al sito.

---

## 8. Sistema di prenotazione (dettagli)

Guida completa: **`SETUP-PRENOTAZIONI.md`**. In sintesi:

- **`/prenota`** → mappa dei **99 posti** (Teatro 99 Posti), data unica, ingresso gratuito.
  L'utente sceglie i posti, compila il form → riceve **email con codice** e link di disdetta.
- **`/prenotazione?code=…`** → annulla una prenotazione (libera i posti).
- **`/admin`** → password (`ADMIN_PASSWORD`): conteggi live, elenco, **check-in**, **export CSV**.
- **Promemoria automatico**: `api/cron/reminders.js`, schedulato in `vercel.json` (ogni giorno alle 9:00);
  invia solo quando l'evento è dentro la finestra `reminderHoursBefore` (default 48h).

### ★ Dati dell'evento — `lib/event.js`
È l'**UNICO** punto dove cambiare data, ora, luogo, capienza, email di contatto dello spettacolo.
Attualmente: 27 settembre 2026, ore 18:30, Teatro 99 Posti (Torelli di Mercogliano, AV), 99 posti.
La data serve anche a far partire i promemoria: aggiornala qui e basta.

### Piantina posti — `lib/seatmap.js`
Fonte unica di verità della disposizione dei posti. Per verificarla visivamente apri
`preview-mappa.html` con doppio clic (non serve server).

### Database Supabase
Progetto **artificiale-sara-lei**, ref `zuymlldglrafcbytjzyl` (EU Central). Tabella `reservations`
già creata (`db/schema.sql`). Connessione via **Transaction pooler** (porta 6543) → variabile `DATABASE_URL`.

#### ★ Pausa automatica dopo 7 giorni (piano free)
Supabase mette **in pausa** il progetto dopo 7 giorni senza richieste. Con il progetto in pausa
tutte le API danno 500 e la pagina prenotazioni mostra *"Impossibile caricare la mappa dei posti"*.
I dati **non** si perdono: basta riaprirlo (Supabase → progetto → *Restore*), ci mette qualche minuto.

Per evitare che succeda ci sono **due difese indipendenti** (se una si ferma, l'altra regge):

1. **Cron di Vercel** — `api/cron/reminders.js` fa un ping al database (`pingDb()` in `lib/db.js`,
   una `SELECT 1`) **prima** di qualsiasi uscita anticipata. Attenzione: in origine l'handler usciva
   subito con `outside_window` senza toccare il DB, ed è esattamente per questo che il progetto
   andava in pausa. Se un domani si riorganizza quel file, **il ping deve restare la prima cosa
   che accade dopo il controllo di autenticazione**.
2. **GitHub Actions** — `.github/workflows/keepalive.yml` chiama `/api/seats` ogni 6 ore.
   Gratuito e illimitato (il repo è pubblico), e non dipende da Vercel. Se fallisce, GitHub manda
   un'email: quell'email significa che il DB è **già** giù, non che il ping non ha funzionato.
   *Nota*: GitHub sospende i workflow schedulati dopo 60 giorni di inattività del repo (avvisa prima
   via email); basta un commit qualsiasi, o riattivarlo dalla tab *Actions*, per rimetterlo in moto.

Verifiche rapide:
- stato del DB → `curl -s -o /dev/null -w "%{http_code}" https://www.teatrodellescienze.it/api/seats` (deve dare `200`);
- cron Vercel → Vercel, progetto, *Cron Jobs* (storico esecuzioni);
- keep-alive GitHub → tab *Actions* del repo, workflow "Keep-alive database"
  (si può anche lanciare a mano con *Run workflow*).

---

## 9. Variabili d'ambiente

Vanno impostate **su Vercel** (Settings → Environment Variables), mai committate.
Elenco in `.env.example`:

| Variabile | A cosa serve |
|---|---|
| `DATABASE_URL` | Postgres/Supabase (pooler, porta 6543) |
| `RESEND_API_KEY` | Invio email. **Se manca, la prenotazione funziona lo stesso** ma non parte l'email |
| `MAIL_FROM` | Mittente email (con dominio verificato: `... <anteprima@teatrodellescienze.it>`) |
| `SITE_URL` | URL pubblico (per il link di disdetta nelle email) |
| `ADMIN_PASSWORD` | Password del pannello `/admin` |
| `CRON_SECRET` | Protegge l'endpoint dei promemoria |

---

## 10. Ricette rapide ("come faccio a…")

- **Cambiare un testo della home** → cerca il testo in `index.html`, modificalo. Se il testo è
  in grassetto nella grafica, usa `<strong>…</strong>`.
- **Cambiare stile/colori** → `style.css` (usa le variabili `:root`). **Ricorda di alzare `?v=` in `index.html`.**
- **Aggiungere/riordinare voci di menu** → blocco `<nav class="nav-menu">` in `index.html` (~riga 92);
  tieni l'ordine coerente con le sezioni. Aggiorna anche il menu mobile se presente.
- **Cambiare data/luogo dello spettacolo** → SOLO `lib/event.js`.
- **Aggiornare i materiali scaricabili** (brochure + locandina) → rigenera `assets/materiali.zip`.
  Contiene `Brochure-Artificiale-sara-lei.pdf` + `Locandina-Artificiale-sara-lei.jpg`.
  Esempio: metti i nuovi file in una cartella temporanea e
  `cd cartella && zip -X materiali.zip Brochure-Artificiale-sara-lei.pdf Locandina-Artificiale-sara-lei.jpg`,
  poi sostituisci `assets/materiali.zip`. Il bottone è nella sezione `#contatti` (`.materiali-block`).
- **Aggiungere foto alla galleria** → metti il file in `assets/gallery/` e aggiungi una `<div class="slide">`
  nella sezione `#galleria` di `index.html`.
- **Aggiungere un brano alle Musiche** → file in `assets/audio/` + voce in `assets/audio/metadata.json`
  e nel markup della sezione `#playlist`.

---

## 11. Trappole da conoscere (riassunto)

1. **CSS in cache** → alza sempre `style.css?v=N` quando modifichi lo stile.
2. **`foto_15.jpg`** → non pushare mai la sua cancellazione (è ancora usata in galleria).
3. **API e clean URL** non funzionano con il semplice `python http.server`: usa `vercel dev` per testarle.
4. **`lib/event.js`** è il punto unico per i dati evento; non duplicarli altrove.
5. **File sorgente nella root** (brochure/locandine/PDF copione) non sono parte del sito: non linkarli, non committarli.
6. **Email**: senza `RESEND_API_KEY` il sistema regge (mostra il codice a schermo), ma non manda mail.
7. **Deploy**: push su `main` = pubblicazione automatica. Non c'è staging separato.
8. **Supabase va in pausa dopo 7 giorni di inattività** (piano free) e le prenotazioni danno 500.
   Due keep-alive lo prevengono (cron Vercel + GitHub Actions): non toglierli (§8, "Pausa automatica").

---

*Ultimo aggiornamento di questa guida: agosto 2026.*
