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
      }
    }
  }

  function showLogin() {
    $('dashboard').classList.add('hidden');
    $('logoutBtn').classList.add('hidden');
    $('loginBox').classList.remove('hidden');
  }

  function showDashboard() {
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

    // Se già loggato in questa sessione, entra diretto
    if (pw()) showDashboard();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
