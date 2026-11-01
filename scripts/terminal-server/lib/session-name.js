'use strict'

/**
 * Nomes de sessão tmux aceitos do cliente. Só `agent-<número>`: o nome vai
 * para uma linha de comando no host remoto, então nada além disso passa.
 * (Limite de 6 dígitos para não aceitar números absurdos.)
 */
const SESSION_NAME_RE = /^agent-\d{1,6}$/

function isValidSessionName(name) {
  return typeof name === 'string' && SESSION_NAME_RE.test(name)
}

/** Próximo nome livre: agent-(maior número + 1), começando em agent-1. */
function nextSessionName(existingNames) {
  let max = 0
  for (const name of existingNames) {
    if (!isValidSessionName(name)) continue
    const n = Number(name.slice('agent-'.length))
    if (n > max) max = n
  }
  return `agent-${max + 1}`
}

/** Id de canal escolhido pelo cliente para multiplexar terminais no WS. */
const CHANNEL_ID_RE = /^[A-Za-z0-9_-]{1,32}$/

function isValidChannelId(sid) {
  return typeof sid === 'string' && CHANNEL_ID_RE.test(sid)
}

module.exports = {
  SESSION_NAME_RE,
  isValidSessionName,
  nextSessionName,
  isValidChannelId,
}
