// Invio email tramite Resend, con template grafico curato e condiviso.
// Se RESEND_API_KEY non è configurata le funzioni restituiscono { skipped:true }
// (non falliscono, così il resto del flusso continua).

import { Resend } from 'resend';
import { EVENT } from './event.js';
import { esc, formatEventDate } from './util.js';

const BRAND = '#B5903B';
const BRAND_DARK = '#8F6F2C';
const INK = '#1A1A1A';
const MUTED = '#6B7280';
const DOMAIN = 'teatrodellescienze.it';

function client() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// Mittente. Con local part (es. 'info') usa quell'indirizzo sul dominio verificato;
// senza, usa MAIL_FROM (o l'onboarding di Resend come fallback).
function fromAddress(local) {
  if (local) return `Artificiale sarà lei <${local}@${DOMAIN}>`;
  return process.env.MAIL_FROM || `Anteprima Docenti <onboarding@resend.dev>`;
}

function siteUrl() {
  return (process.env.SITE_URL || `https://${DOMAIN}`).replace(/\/$/, '');
}

// ---- Componenti grafici condivisi ----

function layout({ preheader = '', badge = '', badgeBg = '#fbf7ec', badgeText = BRAND_DARK, title = '', bodyHtml = '' }) {
  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
  <div style="background:#f4f4f5;padding:28px 12px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${INK}">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.07)">

      <div style="background:#121212;padding:26px 28px;text-align:center">
        <div style="font-size:22px;font-weight:800;letter-spacing:.3px;color:#ffffff">Artificiale <span style="color:${BRAND}">sarà lei</span></div>
        <div style="font-size:11px;color:#9ca3af;margin-top:6px;letter-spacing:2px;text-transform:uppercase">Lezione-spettacolo sull'IA</div>
      </div>

      <div style="padding:34px 30px 24px">
        ${badge ? `<div style="text-align:center;margin-bottom:14px"><span style="display:inline-block;background:${badgeBg};color:${badgeText};font-weight:700;font-size:12px;letter-spacing:.4px;padding:7px 15px;border-radius:999px">${badge}</span></div>` : ''}
        ${title ? `<h1 style="text-align:center;font-size:25px;line-height:1.25;margin:0 0 20px;color:${INK}">${title}</h1>` : ''}
        ${bodyHtml}
      </div>

      <div style="background:#faf7f0;border-top:1px solid #eee;padding:22px 28px;text-align:center">
        <div style="font-weight:700;color:${INK};font-size:14px">Teatro 99 Posti</div>
        <div style="color:${MUTED};font-size:12px;margin-top:5px;line-height:1.6">
          Via Traversa 91, Torelli di Mercogliano (AV) · 83013<br>
          Tel 389 885 6273 · <a href="https://${DOMAIN}" style="color:${BRAND};text-decoration:none">${DOMAIN}</a>
        </div>
      </div>

    </div>
    <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">In collaborazione con l'Università di Salerno · Progetto Alpha Mente</div>
  </div>`;
}

function seatsHtml(seats) {
  return seats
    .map((s) => `<span style="display:inline-block;background:${BRAND};color:#fff;font-weight:700;font-size:13px;border-radius:7px;padding:5px 11px;margin:0 4px 4px 0">${s}</span>`)
    .join('');
}

function detailRow(label, value, last) {
  const border = last ? '' : 'border-bottom:1px solid #f0f0f0;';
  return `<tr><td style="padding:11px 0;${border}color:${MUTED};font-size:13px;width:88px;vertical-align:top">${label}</td><td style="padding:11px 0;${border}font-weight:600;font-size:14px;color:${INK}">${value}</td></tr>`;
}

function ctaButton(href, text) {
  return `<div style="text-align:center;margin:26px 0 6px"><a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px">${text}</a></div>`;
}

// ---- Email specifiche ----

export async function sendConfirmation({ to, name, code, seats }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const cancelUrl = `${siteUrl()}/prenotazione?code=${encodeURIComponent(code)}`;

  const body = `
    <p style="font-size:16px;margin:0 0 14px">Ciao <strong>${esc(name)}</strong>,</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">la tua prenotazione per l'<strong>Anteprima Docenti</strong> è confermata. Conserva questo codice: ti sarà chiesto all'ingresso.</p>

    <div style="background:#faf7f0;border:1px dashed ${BRAND};border-radius:12px;text-align:center;padding:18px;margin:0 0 24px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED}">Codice prenotazione</div>
      <div style="font-size:29px;font-weight:800;letter-spacing:3px;color:${BRAND_DARK};margin-top:6px">${esc(code)}</div>
    </div>

    <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 8px">
      ${detailRow('Quando', esc(formatEventDate(EVENT.dateISO)))}
      ${detailRow('Dove', esc(EVENT.venue))}
      ${detailRow('Posti', seatsHtml(seats), true)}
    </table>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;margin:18px 0 0">Non puoi più partecipare? <a href="${cancelUrl}" style="color:${BRAND};font-weight:600;text-decoration:none">Annulla la prenotazione</a> per liberare i posti.</p>
  `;

  return resend.emails.send({
    from: fromAddress(),
    to,
    subject: `Prenotazione confermata — ${EVENT.title} (${code})`,
    html: layout({
      preheader: `Codice ${code} · ${seats.length} ${seats.length === 1 ? 'posto' : 'posti'} · ${formatEventDate(EVENT.dateISO)}`,
      badge: '✓ Prenotazione confermata',
      badgeBg: '#ecfdf5',
      badgeText: '#047857',
      title: 'Ci vediamo a teatro! 🎭',
      bodyHtml: body,
    }),
  });
}

export async function sendReminder({ to, name, code, seats }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const body = `
    <p style="font-size:16px;margin:0 0 14px">Ciao <strong>${esc(name)}</strong>,</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">ti ricordiamo il tuo appuntamento con <strong>${esc(EVENT.title)}</strong>. Ti aspettiamo!</p>

    <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 8px">
      ${detailRow('Quando', esc(formatEventDate(EVENT.dateISO)))}
      ${detailRow('Dove', esc(EVENT.venue))}
      ${detailRow('Codice', `<span style="letter-spacing:2px">${esc(code)}</span>`)}
      ${detailRow('Posti', seatsHtml(seats), true)}
    </table>
  `;

  return resend.emails.send({
    from: fromAddress(),
    to,
    subject: `Promemoria — ${EVENT.title} è vicino!`,
    html: layout({
      preheader: `${formatEventDate(EVENT.dateISO)} · codice ${code}`,
      badge: '⏰ Promemoria',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      title: 'Manca poco! 🎭',
      bodyHtml: body,
    }),
  });
}

// Auto-risposta al docente/dirigente che compila il form contatti.
export async function sendContactAutoReply({ to, name }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const body = `
    <p style="font-size:16px;margin:0 0 14px">Ciao <strong>${esc(name)}</strong>,</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 18px">grazie per averci scritto! Abbiamo ricevuto la tua richiesta e ti <strong>risponderemo a breve</strong>, di norma entro 1–2 giorni lavorativi.</p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 6px">Nel frattempo puoi scoprire lo spettacolo o prenotare un posto per l'anteprima docenti.</p>
    ${ctaButton(`${siteUrl()}/prenota`, 'Prenota l\'Anteprima Docenti')}
    <p style="font-size:13px;color:${MUTED};text-align:center;margin:14px 0 0">A presto,<br>il team di <strong>Artificiale sarà lei</strong></p>
  `;

  return resend.emails.send({
    from: fromAddress('info'),
    replyTo: EVENT.contactEmail,
    to,
    subject: `Grazie per averci contattato — Artificiale sarà lei`,
    html: layout({
      preheader: 'Abbiamo ricevuto la tua richiesta: ti rispondiamo a breve.',
      badge: 'Richiesta ricevuta',
      badgeBg: '#eff6ff',
      badgeText: '#1d4ed8',
      title: 'Grazie, ti ricontattiamo a breve!',
      bodyHtml: body,
    }),
  });
}

// Notifica interna (a chi gestisce le richieste) con i dati del form.
export async function sendContactNotification(d) {
  const resend = client();
  if (!resend) return { skipped: true };

  const rows = [
    ['Nome', d.name],
    ['Email', d.email],
    ['Telefono', d.phone],
    ['Scuola', d.school],
    ['Ruolo', d.role],
    ['Tipo richiesta', d.requestType],
    ['Note', d.notes],
  ]
    .filter(([, v]) => v)
    .map(([k, v], i, arr) => detailRow(k, esc(v), i === arr.length - 1))
    .join('');

  const body = `
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 18px">È arrivata una nuova richiesta dal form contatti del sito:</p>
    <table role="presentation" width="100%" style="border-collapse:collapse">${rows}</table>
    <p style="font-size:13px;color:${MUTED};margin:18px 0 0">Rispondi direttamente a questa email per contattare il richiedente.</p>
  `;

  return resend.emails.send({
    from: fromAddress('info'),
    replyTo: d.email,
    to: EVENT.contactEmail,
    subject: `Nuova richiesta: ${d.name}${d.school ? ' — ' + d.school : ''}`,
    html: layout({
      badge: 'Form contatti',
      badgeBg: '#f1f5f9',
      badgeText: '#334155',
      title: 'Nuova richiesta dal sito',
      bodyHtml: body,
    }),
  });
}
