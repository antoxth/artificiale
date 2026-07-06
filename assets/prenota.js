// Logica pagina di prenotazione: carica la mappa, gestisce la selezione posti,
// invia la prenotazione a /api/reserve.

(() => {
  const state = {
    selected: new Set(),
    occupied: new Set(),
    capacity: 99,
  };

  const $ = (id) => document.getElementById(id);

  const ERRORS = {
    missing_name: 'Inserisci il nome.',
    invalid_email: "L'email non è valida.",
    missing_consent: 'Devi accettare il trattamento dei dati.',
    no_seats: 'Seleziona almeno un posto.',
    invalid_seat: 'Uno dei posti selezionati non è valido.',
    seats_taken: 'Spiacenti, uno o più posti sono appena stati prenotati. Ho aggiornato la mappa: scegli altri posti.',
    server_error: 'Errore del server. Riprova tra poco.',
    network: 'Problema di connessione. Controlla la rete e riprova.',
  };

  async function loadSeats() {
    const res = await fetch('/api/seats');
    if (!res.ok) throw new Error('seats');
    return res.json();
  }

  function renderEvent(ev) {
    $('evTitle').textContent = ev.title;
    $('evSub').textContent = ev.subtitle || '';
    $('evDate').textContent = ev.dateLabel;
    $('evVenue').textContent = ev.venue;
    $('capacity').textContent = ev.capacity;
    state.capacity = ev.capacity;
  }

  function renderRemaining(remaining) {
    $('remaining').textContent = remaining;
  }

  function makeSeat(num, note) {
    const btn = document.createElement('button');
    btn.className = 'seat';
    btn.type = 'button';
    btn.textContent = num;
    btn.dataset.seat = num;
    btn.title = note ? `Posto ${num} — ${note}` : `Posto ${num}`;
    if (state.occupied.has(num)) {
      btn.classList.add('occupied');
      btn.disabled = true;
    } else {
      btn.classList.add('free');
      btn.addEventListener('click', () => toggleSeat(num, btn));
    }
    return btn;
  }

  function renderBlock(el, rows, notes) {
    el.innerHTML = '';
    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'seat-row' + (row.indent ? ' indent' : '');
      for (const num of row.seats) {
        rowEl.appendChild(makeSeat(num, notes[num]));
      }
      el.appendChild(rowEl);
    }
  }

  function toggleSeat(num, btn) {
    if (state.selected.has(num)) {
      state.selected.delete(num);
      btn.classList.remove('selected');
    } else {
      state.selected.add(num);
      btn.classList.add('selected');
    }
    updateSelectionUI();
  }

  function selectedSorted() {
    return [...state.selected].sort((a, b) => a - b);
  }

  function chipHtml(seats) {
    return seats.map((s) => `<span>${s}</span>`).join('');
  }

  function updateSelectionUI() {
    const seats = selectedSorted();
    $('selCount').textContent = seats.length;
    $('selChips').innerHTML = chipHtml(seats);
    $('toFormBtn').disabled = seats.length === 0;
  }

  function showForm() {
    $('formChips').innerHTML = chipHtml(selectedSorted());
    $('formSection').classList.remove('hidden');
    $('formSection').scrollIntoView({ behavior: 'smooth' });
  }

  function showError(key) {
    const box = $('formError');
    box.textContent = ERRORS[key] || ERRORS.server_error;
    box.style.display = 'block';
  }
  function clearError() {
    $('formError').style.display = 'none';
  }

  async function submit(e) {
    e.preventDefault();
    clearError();
    const seats = selectedSorted();
    if (!seats.length) return showError('no_seats');

    const payload = {
      name: $('name').value.trim(),
      email: $('email').value.trim(),
      phone: $('phone').value.trim(),
      school: $('school').value.trim(),
      role: $('role').value,
      notes: $('notes').value.trim(),
      consent: $('consent').checked,
      seats,
    };

    const btn = $('submitBtn');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Invio in corso…';

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        onSuccess(data);
        return;
      }
      if (res.status === 409) {
        // Posti presi nel frattempo: ricarica la mappa
        await refreshMap();
        showError('seats_taken');
      } else {
        showError(data.error);
      }
    } catch (err) {
      showError('network');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function onSuccess(data) {
    $('mapSection').classList.add('hidden');
    $('formSection').classList.add('hidden');
    $('successCode').textContent = data.code;
    $('successChips').innerHTML = chipHtml(data.seats);
    $('emailNote').textContent = data.emailed
      ? 'Ti abbiamo inviato una email di conferma con tutti i dettagli.'
      : 'Annota il codice: la conferma via email verrà attivata a breve.';
    $('successSection').style.display = 'block';
    $('successSection').scrollIntoView({ behavior: 'smooth' });
  }

  async function refreshMap() {
    const data = await loadSeats();
    state.occupied = new Set(data.occupied);
    // Rimuovi dalla selezione i posti diventati occupati
    for (const s of [...state.selected]) {
      if (state.occupied.has(s)) state.selected.delete(s);
    }
    renderBlock($('blockLeft'), data.seatmap.left, data.notes);
    renderBlock($('blockRight'), data.seatmap.right, data.notes);
    // Ripristina l'evidenza dei posti ancora selezionati
    for (const s of state.selected) {
      const el = document.querySelector(`.seat[data-seat="${s}"]`);
      if (el) el.classList.add('selected');
    }
    renderRemaining(data.remaining);
    updateSelectionUI();
  }

  async function init() {
    try {
      const data = await loadSeats();
      renderEvent(data.event);
      state.occupied = new Set(data.occupied);
      renderBlock($('blockLeft'), data.seatmap.left, data.notes);
      renderBlock($('blockRight'), data.seatmap.right, data.notes);
      renderRemaining(data.remaining);
      updateSelectionUI();
    } catch (e) {
      $('hall').innerHTML =
        '<p style="text-align:center;color:#b91c1c">Impossibile caricare la mappa dei posti. Ricarica la pagina.</p>';
    }

    $('toFormBtn').addEventListener('click', showForm);
    $('backToMapBtn').addEventListener('click', () => {
      $('formSection').classList.add('hidden');
      $('mapSection').scrollIntoView({ behavior: 'smooth' });
    });
    $('bookingForm').addEventListener('submit', submit);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
