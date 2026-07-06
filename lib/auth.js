// Autenticazione admin (semplice, adeguata a questo contesto).
// La pagina admin chiede la password e la invia nell'header x-admin-password.

export function isAdmin(req) {
  const pw = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && pw === expected;
}

// Verifica che la richiesta arrivi dal cron di Vercel (o abbia il segreto).
export function isCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // se non configurato, non blocchiamo (utile in sviluppo)
  return req.headers.authorization === `Bearer ${secret}`;
}
