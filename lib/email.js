// Invio email tramite Resend (piano gratuito).
// Tutto è pronto: se RESEND_API_KEY non è configurata, le funzioni non
// falliscono — restituiscono { skipped:true } così la prenotazione va comunque
// a buon fine e la conferma resta visibile a schermo. Basterà aggiungere la
// chiave (e il MAIL_FROM del dominio) per attivarle.

import { Resend } from 'resend';
import { EVENT } from './event.js';
import { esc, formatEventDate } from './util.js';

const BRAND = '#B5903B';

function client() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  // Con dominio verificato: es. 'Artificiale sarà lei <anteprima@tuodominio.it>'.
  // Provvisorio (senza dominio): l'onboarding di Resend.
  return process.env.MAIL_FROM || 'Anteprima Docenti <onboarding@resend.dev>';
}

// URL base del sito (per il link di disdetta). Configurabile via env.
function siteUrl() {
  return (process.env.SITE_URL || '').replace(/\/$/, '');
}

function layout(inner) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
    <div style="background:#121212;padding:24px;text-align:center">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px">
        Artificiale <span style="color:${BRAND}">sarà lei</span>
      </span>
    </div>
    <div style="padding:28px 24px;background:#fff;border:1px solid #E2E8F0;border-top:none">
      ${inner}
    </div>
    <div style="padding:16px 24px;color:#64748B;font-size:12px;text-align:center">
      Teatro 99 Posti · Via Traversa 91, Torelli di Mercogliano (AV)
    </div>
  </div>`;
}

function seatsHtml(seats) {
  return seats
    .map(
      (s) =>
        `<span style="display:inline-block;background:${BRAND};color:#fff;font-weight:700;border-radius:6px;padding:4px 10px;margin:2px">${s}</span>`
    )
    .join(' ');
}

export async function sendConfirmation({ to, name, code, seats }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const cancelUrl = siteUrl()
    ? `${siteUrl()}/prenotazione?code=${encodeURIComponent(code)}`
    : null;

  const inner = `
    <p style="font-size:16px">Ciao ${esc(name)},</p>
    <p>la tua prenotazione per <strong>${esc(EVENT.title)}</strong> è confermata. 🎭</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0">
      <tr><td style="padding:6px 0;color:#64748B">Quando</td><td style="padding:6px 0;font-weight:600">${esc(formatEventDate(EVENT.dateISO))}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Dove</td><td style="padding:6px 0;font-weight:600">${esc(EVENT.venue)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Codice</td><td style="padding:6px 0;font-weight:700;letter-spacing:1px">${esc(code)}</td></tr>
    </table>
    <p style="margin-bottom:6px;color:#64748B">Posti riservati:</p>
    <p>${seatsHtml(seats)}</p>
    <p style="margin-top:18px">Conserva questo codice: ti sarà chiesto all'ingresso.</p>
    ${
      cancelUrl
        ? `<p style="margin-top:18px;font-size:14px;color:#64748B">Non puoi più partecipare? <a href="${cancelUrl}" style="color:${BRAND}">Annulla la prenotazione</a> per liberare i posti.</p>`
        : ''
    }
  `;

  return resend.emails.send({
    from: fromAddress(),
    to,
    subject: `Prenotazione confermata — ${EVENT.title} (${code})`,
    html: layout(inner),
  });
}

export async function sendReminder({ to, name, code, seats }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const inner = `
    <p style="font-size:16px">Ciao ${esc(name)},</p>
    <p>ti ricordiamo il tuo appuntamento con <strong>${esc(EVENT.title)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0">
      <tr><td style="padding:6px 0;color:#64748B">Quando</td><td style="padding:6px 0;font-weight:600">${esc(formatEventDate(EVENT.dateISO))}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Dove</td><td style="padding:6px 0;font-weight:600">${esc(EVENT.venue)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Codice</td><td style="padding:6px 0;font-weight:700;letter-spacing:1px">${esc(code)}</td></tr>
    </table>
    <p style="margin-bottom:6px;color:#64748B">Posti:</p>
    <p>${seatsHtml(seats)}</p>
    <p style="margin-top:18px">Ti aspettiamo! 🎭</p>
  `;

  return resend.emails.send({
    from: fromAddress(),
    to,
    subject: `Promemoria — ${EVENT.title} è vicino!`,
    html: layout(inner),
  });
}
