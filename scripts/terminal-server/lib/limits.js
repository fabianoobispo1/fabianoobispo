'use strict'

const MAX_COLS = 500
const MAX_ROWS = 200

/** Inteiro em [min, max]; fora disso (ou não numérico) usa o fallback. */
function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function clampSize(cols, rows) {
  return {
    cols: clampInt(cols, 1, MAX_COLS, 120),
    rows: clampInt(rows, 1, MAX_ROWS, 30),
  }
}

module.exports = { clampInt, clampSize, MAX_COLS, MAX_ROWS }
