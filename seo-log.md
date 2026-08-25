# Log SEO — teatrodellescienze.it

> Registro delle misurazioni mensili previste dalla Fase 4 di `PIANO-SEO.md`.
> Fonte: Google Search Console → Rendimento (tipo di ricerca: Web).
> Una riga per rilevazione. Aggiungere in fondo, non riscrivere lo storico.

## Riepilogo

| Rilevazione | Periodo dati | Impressioni | Clic | CTR | Pos. media | Query visibili |
|---|---|---|---|---|---|---|
| 2026-08-23 | 16/7 → 23/8 (39 gg) | 18 | 3 | 16,67% | 6,11 | nessuna (sotto soglia) |

---

## 2026-08-23 — prima rilevazione

**Attenzione al periodo.** Il filtro diceva "ultimi 3 mesi", ma i dati partono dal
16/7/2026 perché la proprietà è stata verificata il 17/7. Search Console **non recupera
i dati precedenti alla verifica**: quindi sono ~5 settimane e mezza di storico, non 3 mesi.

### Numeri
- **18 impressioni, 3 clic** in 39 giorni → 0,46 impressioni al giorno.
- **25 giorni su 39 (64%) con zero impressioni**; gli ultimi 4 giorni del periodo tutti a zero.
- Posizione media 6,11 — poco significativa su volumi così bassi.
- **Desktop** 12 impressioni / 3 clic / pos. 5,08 · **Mobile** 6 / 0 / pos. 8,17.
- **Italia** 17 impressioni, Regno Unito 1.
- **Una sola pagina** riceve impressioni: la home. `/prenota` zero (corretto: è una pagina
  transazionale, non deve posizionarsi).

### Cosa NON si può dedurre
Il file `Query.csv` è **vuoto**, e non è un errore di esportazione: Google nasconde le query
cercate da troppe poche persone, per tutela della privacy. A 18 impressioni praticamente ogni
query sta sotto quella soglia. **Non sappiamo con quali parole la gente sia arrivata**, quindi
qualsiasi conclusione su "quale keyword funziona" sarebbe inventata.

Anche `Aspetto nella ricerca.csv` è vuoto: nessun risultato arricchito (scheda evento) è ancora
stato mostrato, nonostante il JSON-LD `TheaterEvent` sia presente e valido. Da riverificare
quando i volumi cresceranno.

### Cosa invece è certo
1. **Il sito è indicizzato** e viene servito nei risultati: la base tecnica (Fase 0) regge.
2. **Le due keyword obiettivo non compaiono nel testo visibile.** Verificato sul sorgente:
   "teatro didattico" e "didattica spettacolare" compaiono **0 volte** nel corpo della pagina —
   esistono solo nella meta description, nell'alt della foto hero e nel JSON-LD.
   Sono i punti 3 e 6 della Fase 1, lasciati volutamente in sospeso.
3. **Una sola pagina, 873 parole visibili**, che deve coprire 4 temi di ricerca diversi.
4. **Nessuno cerca ancora il brand**: lo spettacolo non ha ancora debuttato e non c'è stata stampa.

### Conclusione
Non è un problema da diagnosticare: è la conseguenza prevista dal piano. Il sito è visibile
solo a chi lo cerca già per nome, e per ora quelle persone sono pochissime. Il numero si muoverà
quando (a) le keyword entreranno nei testi visibili, (b) nasceranno pagine dedicate, (c) l'anteprima
docenti del 27/9 genererà stampa, link e ricerche di marca.

**Prossima rilevazione consigliata: fine settembre**, subito dopo l'anteprima docenti — sarà la
prima volta con un evento reale alle spalle e quindi il primo confronto con un senso.
