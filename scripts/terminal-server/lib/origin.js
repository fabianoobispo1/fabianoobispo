'use strict'

/**
 * Validação do header Origin do upgrade WebSocket. Navegadores sempre
 * enviam Origin; sem ele (ou fora da lista) a conexão é recusada, o que
 * impede outro site de abrir o WS usando a sessão de quem está logado.
 */

/** "https://a.com, https://b.com" -> Set de origins normalizadas */
function parseAllowedOrigins(value) {
  const set = new Set()
  for (const raw of String(value ?? '').split(',')) {
    const item = raw.trim()
    if (!item) continue
    const url = new URL(item) // lança em valor inválido: falha na partida
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error(`Origin inválida em ALLOWED_ORIGINS: ${item}`)
    }
    set.add(url.origin)
  }
  return set
}

function isOriginAllowed(origin, allowed) {
  if (typeof origin !== 'string' || !origin || origin === 'null') return false
  try {
    return allowed.has(new URL(origin).origin)
  } catch {
    return false
  }
}

module.exports = { parseAllowedOrigins, isOriginAllowed }
