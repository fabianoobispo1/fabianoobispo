'use strict'

/**
 * Log estruturado (uma linha JSON por evento) em stdout. Registra quem
 * conectou, em qual host e quando — NUNCA teclas, saída do terminal ou
 * credenciais.
 */
function log(event, fields = {}) {
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), event, ...fields }),
  )
}

module.exports = { log }
