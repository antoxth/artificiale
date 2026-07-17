# Piano SEO — teatrodellescienze.it

> Obiettivo: posizionare il sito nelle ricerche Google per quattro gruppi di parole chiave
> e costruire un sistema di monitoraggio per verificare i progressi.
> Redatto: luglio 2026. Da rivedere ogni 3 mesi.

---

## 1. Le parole chiave obiettivo (e aspettative realistiche)

| # | Parola chiave | Difficoltà | Obiettivo realistico | Note |
|---|---|---|---|---|
| 1 | **artificiale sarà lei** | Bassa (brand) | **#1 entro poche settimane** | È il nostro titolo: dobbiamo dominare la query |
| 2 | **didattica spettacolare** | Bassa | Top 10 in 2–3 mesi | Termine di nicchia, poca concorrenza: molto vincibile |
| 3 | **teatro didattico** | Media | Top 10 in 4–6 mesi | Concorrono Wikipedia e compagnie storiche; serve una pagina dedicata + link esterni |
| 4 | **liceo matematico** | Alta | Top 10 solo su varianti long-tail | Dominano i siti ufficiali (UMI, UNISA, liceomatematico.it). Puntare a: *"teatro liceo matematico"*, *"spettacolo liceo matematico"*, *"liceo matematico teatro didattico"* |

**Principio guida:** Google posiziona *pagine*, non siti. Oggi abbiamo una sola pagina
(la home) che deve coprire 4 temi: non basta. Serviranno pagine dedicate (Fase 2).

---

## 2. Stato attuale (audit luglio 2026)

### Cosa c'è già di buono ✅
- `<title>` e meta description ben scritti; Open Graph e Twitter card completi.
- Dati strutturati **TheaterEvent** (JSON-LD) per i risultati arricchiti.
- `sitemap.xml` + `robots.txt` presenti; `lang="it"`; un solo H1; **tutte le 19 immagini hanno l'alt**.
- Sito veloce (statico su Vercel), mobile-friendly.

### Problemi rilevati ⚠️
1. **Keyword assenti**: "teatro didattico" e "didattica spettacolare" compaiono **0 volte**
   nei testi del sito. "Liceo matematico" 7 volte (ok). Non ci si posiziona per parole che non si usano.
2. **Dominio incoerente**: la produzione redirige `teatrodellescienze.it` → `www.teatrodellescienze.it` (308),
   ma canonical, Open Graph e sitemap puntano tutti alla versione **senza www**.
   Va uniformato tutto a `https://www.teatrodellescienze.it/`.
3. **Nessun monitoraggio attivo**: niente Google Search Console (o non collegata), nessuna analytics.
   Oggi non sappiamo né se Google ci indicizza bene né con quali query arriva la gente.
4. **Una sola pagina indicizzabile** (la home; `/prenota` è funzionale, `/admin` e `/prenotazione` sono
   giustamente esclusi). Poca "superficie" per posizionarsi su 4 temi diversi.
5. Dati strutturati incompleti: manca lo schema **Organization/PerformingGroup** (chi siamo)
   e un eventuale **FAQPage**.
6. Dettagli minori: il `<title>` chiude con "| Teatro 99 Posti" (meglio il brand "Teatro delle Scienze");
   il meta `keywords` è ignorato da Google (innocuo, ma non serve).

---

## 3. Piano d'azione

### FASE 0 — Fondamenta e monitoraggio (subito, ~1 ora) ★ la più importante
> Senza questa fase non possiamo né migliorare né misurare.

- [ ] **Google Search Console** (gratuita, indispensabile):
      1. Vai su [search.google.com/search-console](https://search.google.com/search-console) con un account Google.
      2. Aggiungi la proprietà **Dominio**: `teatrodellescienze.it` (copre www e non-www).
      3. Verifica via **record TXT DNS** dal pannello Register.it (il metodo alternativo è un
         meta tag HTML nella home — posso aggiungerlo io se preferisci questa via).
      4. Invia la sitemap: `https://www.teatrodellescienze.it/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: importa direttamente la proprietà da Search Console (2 clic).
- [ ] **Analytics**: attiva **Vercel Web Analytics** dal pannello Vercel (Analytics → Enable).
      Lo script è già inserito nelle pagine (17/7/2026): basta abilitarlo dal pannello.
- [x] **Allineare il dominio a www** — FATTO il 17/7/2026:
      canonical (home + prenota), `og:url`, `og:image`, twitter:image, sitemap.xml (+ lastmod),
      robots.txt e JSON-LD → tutti su `https://www.teatrodellescienze.it/...`.

### FASE 1 — Ottimizzazione on-page della home (1 settimana)
> Inserire le parole chiave nei testi esistenti in modo naturale, senza stravolgerli.

- [x] **Title tag** — FATTO 17/7/2026: «Artificiale sarà lei — Lezione-spettacolo sull'IA | Teatro delle Scienze».
- [x] **Meta description** — FATTO 17/7/2026: include "teatro didattico" e "Liceo Matematico".
- [ ] **Testi visibili** — inserimenti naturali:
      - Sezione "Cos'è" o hero: definire lo spettacolo come esempio di **teatro didattico**
        e di **didattica spettacolare** (1–2 occorrenze ciascuna, non di più: keyword stuffing = penalità).
      - Scheda "Teatro delle Scienze" (Chi siamo): già parla di "teatro come strumento didattico" →
        aggiungere esplicitamente le due espressioni.
      - Alt di 2–3 immagini chiave: includere "teatro didattico" dove pertinente.
- [x] **Dati strutturati** — FATTO 17/7/2026: JSON-LD **PerformingGroup** "Teatro delle Scienze"
      (parentOrganization DipMat UNISA, knowsAbout con le keyword, membri) + corretto l'organizer
      del TheaterEvent (era "Teatro 99 Posti", ora "Teatro delle Scienze"). Alt hero + 4 foto gallery
      riscritti con descrizioni reali. In sospeso: inserimenti keyword nei testi visibili (punto 3)
      e sezione FAQ (punto 6).
- [ ] **FAQ + schema FAQPage** (opzionale ma consigliata): 4–6 domande reali dei docenti
      ("Per quali scuole è adatto?", "Quanto dura?", "Cos'è la didattica spettacolare?", "Come si prenota?").
      Le FAQ sono un posto perfetto per usare le keyword in modo naturale.

### FASE 1-bis — Prestazioni e rifiniture (Core Web Vitals) — FATTO 17/7/2026
- [x] `width`/`height` su tutte le 18 immagini (elimina i "salti" di layout / CLS).
- [x] `loading="lazy"` su gallery e loghi partner (16 immagini); `fetchpriority="high"` sulla hero.
- [x] Favicon vere dal logo chip (16/32px + apple-touch-icon 180px) al posto della foto JPG.
- [x] 3 canzoni della playlist convertite WAV → MP3 192k (da 24 MB a 3 MB, −87%).
- [x] Open Graph allineato: og:site_name "Teatro delle Scienze", og:title/og:description coerenti.

### FASE 2 — Pagine dedicate (2–6 settimane)
> La mossa che sposta davvero le classifiche: una pagina per ogni tema di ricerca.

- [ ] **`/teatro-didattico`** — "Il teatro didattico secondo Teatro delle Scienze":
      cos'è il teatro didattico, la nostra esperienza (Numero ergo sum, Artificiale sarà lei),
      perché funziona in classe, testimonianze. 600+ parole originali.
- [ ] **`/didattica-spettacolare`** — "La didattica spettacolare: imparare con lo stupore":
      il metodo, il rapporto col Liceo Matematico, esempi concreti dallo spettacolo.
      (Se i contenuti sono pochi, in alternativa unire i due temi in un'unica pagina
      `/metodo` ben fatta — meglio una pagina forte che due deboli.)
- [ ] **`/liceo-matematico`** — approfondimento sul progetto e sul ruolo del teatro al suo interno
      (qui si vincono le long-tail "teatro liceo matematico" ecc.).
- [ ] Per ogni nuova pagina: title/description propri, H1 con la keyword, link dalla home
      (menu o footer), aggiunta alla sitemap, canonical proprio.
- [ ] **Collegamenti interni**: dalla home alle nuove pagine e viceversa, con anchor text
      descrittivi ("il nostro metodo di teatro didattico", non "clicca qui").

### FASE 3 — Autorevolezza e link esterni (continuativa)
> Google si fida di chi viene citato. Per "teatro didattico" i backlink faranno la differenza.

- [ ] **Partner istituzionali** (i più preziosi, e già nostri alleati):
      chiedere un link a teatrodellescienze.it da:
      - pagina del progetto **Liceo Matematico** (liceomatematico.it / sito UNISA-DipMat),
      - sito del **Dipartimento di Matematica UNISA** (news/eventi),
      - sito del **Teatro 99 Posti** (stagione/eventi).
- [ ] **Stampa locale e di settore**: comunicato per l'Anteprima Docenti a testate irpine/campane
      e a portali scuola (Orizzonte Scuola, Tecnica della Scuola…). Ogni articolo = un link.
- [ ] **Directory ed elenchi**: portali di teatro per ragazzi/scuole, elenchi spettacoli didattici,
      eventuali albi regionali di educazione teatrale.
- [ ] **Social**: anche solo profili attivi (Instagram/Facebook/YouTube per il trailer) con link
      al sito nel profilo — segnali di esistenza e fonti di traffico.
- [ ] Dopo ogni replica: chiedere alla scuola ospite una news sul proprio sito con link.

### FASE 4 — Monitoraggio (routine mensile, 20 minuti)

**Ogni mese, su Google Search Console → Rendimento:**

| Cosa guardare | Dove | Cosa annotare |
|---|---|---|
| Posizione media per le 4 keyword | Query → filtro per parola | posizione + variazione |
| Impressioni e clic totali | Panoramica | trend mese su mese |
| Query nuove/inaspettate | Query, ordinate per impressioni | opportunità di contenuti |
| Pagine indicizzate | Indicizzazione → Pagine | anomalie (pagine escluse) |
| CTR della home | Pagine | se < 2–3% con molte impressioni → rivedere title/description |

- [ ] Tenere un file `seo-log.md` (o un foglio) con una riga al mese:
      `data | posizione "artificiale sarà lei" | "didattica spettacolare" | "teatro didattico" | "liceo matematico" | clic | note`
- [ ] Controllo rapido manuale: ricerca in **finestra di navigazione anonima** delle 4 query
      (la posizione personalizzata inganna).
- [ ] Ogni 3 mesi: rivedere questo piano, spuntare le caselle, decidere la fase successiva.

---

## 4. Cosa NON fare
- ❌ Keyword stuffing (ripetere le keyword ovunque): penalizza e rovina i testi.
- ❌ Comprare backlink o scambi link massivi.
- ❌ Creare pagine doppione con testi quasi uguali per keyword simili.
- ❌ Aspettarsi risultati in giorni: la SEO si misura in **mesi** (il brand in settimane).

## 5. Sequenza consigliata dei prossimi passi
1. **Oggi**: Fase 0 (Search Console + allineamento www — la parte tecnica la faccio io, la
   verifica DNS su Register.it richiede il tuo accesso).
2. **Questa settimana**: Fase 1 (ritocchi on-page alla home).
3. **Prossime settimane**: scrivere i contenuti per le pagine della Fase 2 (posso preparare le bozze).
4. **Da subito e per sempre**: Fase 3 (chiedere i link ai partner — un'email ben scritta basta)
   e la routine di monitoraggio della Fase 4.
