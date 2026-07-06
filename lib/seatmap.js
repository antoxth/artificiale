// Piantina REALE del Teatro 99 Posti (99 posti totali).
// Fonte unica di verità: usata dal server (validazione) e inviata al client
// tramite /api/seats per disegnare la mappa.
//
// La sala è "a gradinate": il Palcoscenico è in basso (posti più bassi),
// la Porta è in alto. Le file da 7 posti sono rientrate rispetto a quelle
// da 8 (campo `indent`, in mezze-poltrone).
//
// Ogni riga è elencata dall'alto (Porta) verso il basso (Palcoscenico),
// come appare nella piantina reale.

export const SEATMAP = {
  left: [
    { seats: [38, 39, 40, 41, 42, 43, 44, 45], indent: 0 },
    { seats: [31, 32, 33, 34, 35, 36, 37], indent: 1 },
    { seats: [23, 24, 25, 26, 27, 28, 29, 30], indent: 0 },
    { seats: [16, 17, 18, 19, 20, 21, 22], indent: 1 },
    { seats: [8, 9, 10, 11, 12, 13, 14, 15], indent: 0 },
    { seats: [1, 2, 3, 4, 5, 6, 7], indent: 1 },
    { seats: [85, 86, 87, 88, 89, 90, 91, 92], indent: 0 },
  ],
  right: [
    { seats: [79, 80, 81, 82, 83, 84], indent: 0 },
    { seats: [74, 75, 76, 77, 78], indent: 1 },
    { seats: [67, 68, 69, 70, 71, 72, 73], indent: 0 },
    { seats: [60, 61, 62, 63, 64, 65, 66], indent: 0 },
    { seats: [53, 54, 55, 56, 57, 58, 59], indent: 0 },
    { seats: [46, 47, 48, 49, 50, 51, 52], indent: 0 },
    { seats: [93, 94, 95, 96, 97, 98, 99], indent: 0 },
  ],
};

// Note speciali su singoli posti (mostrate nel tooltip).
export const SEAT_NOTES = {
  85: 'Situato in realtà tra i posti 1 e 2',
};

// Elenco piatto di tutti i numeri di posto validi.
export const ALL_SEATS = [...SEATMAP.left, ...SEATMAP.right]
  .flatMap((row) => row.seats);

// Set per validazione veloce lato server.
export const SEAT_SET = new Set(ALL_SEATS);

export function isValidSeat(n) {
  return SEAT_SET.has(Number(n));
}
