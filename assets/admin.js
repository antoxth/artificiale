// Logica pagina admin: login con password, dashboard prenotati, check-in, export CSV.
// La password è tenuta in sessionStorage e inviata nell'header x-admin-password.

(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'asl_admin_pw';

  function pw() {
    return sessionStorage.getItem(KEY) || '';
  }
  function headers() {
    return { 'x-admin-password': pw() };
  }

  async function fetchList() {
    const res = await fetch('/api/admin/list', { headers: headers() });
    if (res.status === 401) throw new Error('unauthorized');
    if (!res.ok) throw new Error('server');
    return res.json();
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
    );
  }

  function renderSeatTags(booking) {
    const present = new Set(booking.checkedInSeats);
    return booking.seats
      .sort((a, b) => a - b)
      .map(
        (s) =>
          `<span class="seat-tag${present.has(s) ? ' present' : ''}" data-seat="${s}" title="Clicca per check-in">${s}</span>`
      )
      .join('');
  }

  function render(data) {
    $('evTitle').textContent = data.event.title;
    $('evDate').textContent = data.event.dateLabel;
    $('stBooked').textContent = data.totals.seatsBooked;
    $('stFree').textContent = data.totals.seatsFree;
    $('stBookings').textContent = data.totals.bookings;
    $('stCheckin').textContent = data.totals.checkedIn;

    const tbody = $('tbody');
    if (!data.bookings.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Ancora nessuna prenotazione.</td></tr>';
      return;
    }

    tbody.innerHTML = data.bookings
      .map(
        (b) => `
      <tr>
        <td>${renderSeatTags(b)}</td>
        <td>${esc(b.name)}${b.role ? `<br><small style="color:var(--muted)">${esc(b.role)}</small>` : ''}</td>
        <td>${esc(b.school || '—')}</td>
        <td><small>${esc(b.email)}${b.phone ? '<br>' + esc(b.phone) : ''}</small></td>
        <td><code>${esc(b.code)}</code></td>
        <td class="present-cell">${renderSeatTags(b)}</td>
      </tr>`
      )
      .join('');

    // Check-in click (solo colonna Presenza)
    tbody.querySelectorAll('.present-cell .seat-tag').forEach((tag) => {
      tag.addEventListener('click', () => toggleCheckin(tag));
    });
  }

  async function toggleCheckin(tag) {
    const seat = Number(tag.dataset.seat);
    const present = !tag.classList.contains('present');
    tag.classList.toggle('present', present);
    try {
      await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ seat, present }),
      });
      await load(); // riallinea conteggi
    } catch {
      tag.classList.toggle('present', !present); // rollback visivo
    }
  }

  async function load() {
    try {
      const data = await fetchList();
      render(data);
    } catch (e) {
      if (e.message === 'unauthorized') {
        sessionStorage.removeItem(KEY);
        showLogin();
        return;
      }
    }
    loadWaitlist();
    loadTrack();
  }

  // ---- Contatore pagina /anteprima ----

  async function loadTrack() {
    if (!$('trackAdmin')) return;
    try {
      const res = await fetch('/api/track', { headers: headers() });
      if (!res.ok) throw new Error(String(res.status));
      renderTrack(await res.json());
    } catch {
      $('trNote').textContent = 'Contatore non disponibile al momento. Riprova con "Aggiorna".';
    }
  }

  function renderTrack(data) {
    const by = {};
    for (const r of data.bySource) by[r.source] = r;
    const rec = data.recipients || {};
    const group = (key, label) => {
      const n = by[key] ? by[key].visitors : 0;
      $('tr' + label).textContent = n;
      const tot = rec[key];
      const base = key === 'presenti' ? 'Dalla mail ai presenti' : 'Dalla mail agli assenti';
      $('tr' + label + 'L').textContent = tot ? `${base} · ${Math.round((n / tot) * 100)}% di ${tot}` : base;
    };
    group('presenti', 'Presenti');
    group('assenti', 'Assenti');
    $('trVisitors').textContent = data.totals.visitors;
    $('trDownloads').textContent = data.totals.downloaders;
    const direct = by.diretto ? by.diretto.visitors : 0;
    const last = data.totals.last_at ? ` · Ultima visita: ${itDate(data.totals.last_at)}` : '';
    $('trNote').textContent =
      `Aperture totali, comprese quelle ripetute: ${data.totals.views} · Arrivati senza il link della mail: ${direct}${last}`;
  }

  // ---- Lista d'attesa ----

  const WL_LABEL = { in_attesa: 'In attesa', contattato: 'Avvisato', assegnato: 'Posto assegnato', rinuncia: 'Rinuncia' };
  let wlEntries = [];
  let wlFreeSeats = [];

  function itDate(d) {
    return d ? new Date(d).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  }

  async function loadWaitlist() {
    if (!$('wlBody')) return; // pagina admin vecchia in cache: niente sezione lista
    try {
      const res = await fetch('/api/admin/waitlist', { headers: headers() });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      wlEntries = data.entries;
      wlFreeSeats = data.freeSeats;
      renderWaitlist(data);
    } catch {
      $('wlBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#b91c1c">Lista d’attesa non disponibile al momento. Riprova con "Aggiorna".</td></tr>';
    }
  }

  function renderWaitlist(data) {
    $('wlWaiting').textContent = data.totals.in_attesa;
    $('wlContacted').textContent = data.totals.contattato;
    $('wlAssigned').textContent = data.totals.assegnato;
    $('wlDeclined').textContent = data.totals.rinuncia;
    $('wlFree').innerHTML =
      (data.freeSeats.length
        ? `Posti liberi ora: <b>${data.freeSeats.join(', ')}</b>`
        : 'Posti liberi ora: <b>nessuno</b>') +
      ` · Posti richiesti da chi aspetta: <b>${data.totals.postiRichiesti}</b>`;

    if (!data.entries.length) {
      $('wlBody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Nessuno in lista d’attesa.</td></tr>';
      return;
    }

    $('wlBody').innerHTML = data.entries.map((e) => {
      const btns = [];
      if (e.status === 'in_attesa' || e.status === 'contattato') {
        btns.push(`<button class="btn btn-ghost" data-act="offer" data-id="${e.id}"><i class="fa-solid fa-envelope"></i> ${e.status === 'contattato' ? 'Avvisa di nuovo' : 'Avvisa'}</button>`);
        btns.push(`<button class="btn btn-primary" data-act="assign" data-id="${e.id}"><i class="fa-solid fa-chair"></i> Assegna posti</button>`);
        btns.push(`<button class="btn btn-ghost" data-act="decline" data-id="${e.id}">Rinuncia</button>`);
      } else if (e.status === 'rinuncia') {
        btns.push(`<button class="btn btn-ghost" data-act="restore" data-id="${e.id}">Rimetti in attesa</button>`);
      }
      const extra = e.status === 'assegnato' && e.reservation_code
        ? `<br><small>codice <code>${esc(e.reservation_code)}</code></small>`
        : e.status === 'contattato' && e.contacted_at ? `<br><small>avvisato ${esc(itDate(e.contacted_at))}</small>` : '';
      return `
      <tr>
        <td>${e.n}<br><small>${esc(itDate(e.created_at))}</small></td>
        <td><span class="wl-seats">${Number(e.seats_requested) || 1}</span></td>
        <td>${esc(e.name)}${e.role ? `<br><small>${esc(e.role)}</small>` : ''}${e.notes ? `<br><small>“${esc(e.notes)}”</small>` : ''}</td>
        <td>${esc(e.school || '—')}</td>
        <td><small>${esc(e.email)}${e.phone ? '<br>' + esc(e.phone) : ''}</small></td>
        <td><span class="wl-status wl-${esc(e.status)}">${esc(WL_LABEL[e.status] || e.status)}</span>${extra}</td>
        <td><div class="wl-actions">${btns.join('')}</div></td>
      </tr>`;
    }).join('');

    $('wlBody').querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => waitlistAction(b.dataset.act, Number(b.dataset.id), b));
    });
  }

  async function postWaitlist(body) {
    const res = await fetch('/api/admin/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok, data };
  }

  const WL_ERRORS = {
    seats_taken: 'Uno o più di quei posti sono già occupati.',
    invalid_seat: 'Numero di posto non valido.',
    no_seats: 'Indica almeno un posto.',
    already_assigned: 'A questa persona è già stato assegnato un posto.',
    not_waiting: 'Questa persona non è più in attesa.',
  };

  async function waitlistAction(act, id, btn) {
    const e = wlEntries.find((x) => x.id === id);
    if (!e) return;
    let body;

    if (act === 'offer') {
      if (!confirm(`Invio a ${e.name} (${e.email}) l'email "Si è liberato un posto"?\n\nLe sue risposte arriveranno a te.`)) return;
      body = { action: 'offer', id };
    } else if (act === 'assign') {
      const wanted = Number(e.seats_requested) || 1;
      const hint = wlFreeSeats.length ? `Posti liberi ora: ${wlFreeSeats.join(', ')}` : 'Al momento non risultano posti liberi.';
      // Proposta: i primi posti liberi, quanti ne ha chiesti (modificabile)
      const suggestion = wlFreeSeats.slice(0, wanted).join(', ');
      const input = prompt(`${e.name} ha chiesto ${wanted} ${wanted === 1 ? 'posto' : 'posti'}.\nQuali posti assegno? Numeri separati da virgola.\n\n${hint}`, suggestion);
      if (input === null) return;
      const seats = input.split(/[\s,;]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
      if (!seats.length) return alert(WL_ERRORS.no_seats);
      const diff = seats.length !== wanted ? `\n\nAttenzione: ne aveva chiesti ${wanted}, ne assegni ${seats.length}.` : '';
      if (!confirm(`Assegno ${seats.length === 1 ? 'il posto' : 'i posti'} ${seats.join(', ')} a ${e.name} e invio la conferma con il codice a ${e.email}?${diff}`)) return;
      body = { action: 'assign', id, seats };
    } else if (act === 'decline') {
      if (!confirm(`Segno ${e.name} come "Rinuncia"? Non riceverà nessuna email.`)) return;
      body = { action: 'status', id, status: 'rinuncia' };
    } else if (act === 'restore') {
      body = { action: 'status', id, status: 'in_attesa' };
    } else {
      return;
    }

    btn.disabled = true;
    const { ok, data } = await postWaitlist(body);
    if (!ok) {
      alert(WL_ERRORS[data.error] || 'Operazione non riuscita. Riprova.');
      btn.disabled = false;
      return;
    }
    if (act === 'assign') {
      alert(`Fatto: prenotazione ${data.code} creata.` + (data.emailed ? ' Conferma inviata.' : ' ATTENZIONE: la conferma email non è partita.'));
    }
    load(); // riallinea prenotazioni, conteggi e lista
  }

  function downloadWaitlistCsv() {
    fetch('/api/admin/waitlist?format=csv', { headers: headers() })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lista-attesa-anteprima-docenti.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Esportazione non riuscita. Riprova.'));
  }

  function showLogin() {
    $('dashboard').classList.add('hidden');
    $('logoutBtn').classList.add('hidden');
    $('loginBox').classList.remove('hidden');
  }

  function showDashboard() {
    // Chi usa il pannello (Antonio, Paolo) non va contato tra i visitatori di /anteprima
    try { localStorage.setItem('asl_notrack', '1'); } catch {}
    $('loginBox').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    $('logoutBtn').classList.remove('hidden');
    load();
  }

  async function tryLogin() {
    const val = $('pw').value;
    sessionStorage.setItem(KEY, val);
    try {
      await fetchList();
      $('loginError').style.display = 'none';
      showDashboard();
    } catch {
      sessionStorage.removeItem(KEY);
      $('loginError').style.display = 'block';
    }
  }

  function downloadCsv() {
    // Non possiamo passare header a un semplice link: usiamo fetch + blob.
    fetch('/api/admin/export', { headers: headers() })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prenotati-anteprima-docenti.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  function init() {
    $('loginBtn').addEventListener('click', tryLogin);
    $('pw').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
    $('logoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem(KEY);
      showLogin();
    });
    $('exportBtn').addEventListener('click', downloadCsv);
    $('refreshBtn').addEventListener('click', load);
    if ($('wlExportBtn')) $('wlExportBtn').addEventListener('click', downloadWaitlistCsv);

    // Se già loggato in questa sessione, entra diretto
    if (pw()) showDashboard();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
