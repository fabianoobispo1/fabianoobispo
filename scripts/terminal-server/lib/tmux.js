'use strict'

const { isValidSessionName } = require('./session-name')

/**
 * Montagem dos comandos tmux executados no host remoto via `conn.exec`.
 *
 * Tudo que vem do cliente é validado antes (nome `agent-N`, pasta com
 * charset restrito) e ainda vai entre aspas simples — nenhuma entrada do
 * navegador chega crua ao shell remoto.
 *
 * Socket dedicado (`-L webdeck`): as sessões do terminal web não se
 * misturam com o tmux que o usuário usa no host.
 */
const SOCKET = 'webdeck'
const TMUX = `tmux -L ${SOCKET}`
const PREVIEW_LINES = 8
const CAPTURE_HISTORY = 5000
const LIST_FORMAT = [
  '#{session_name}',
  '#{session_created}',
  '#{session_attached}',
  '#{pane_current_command}',
].join('|')

/** Aspas simples de shell POSIX. */
function shq(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function assertSessionName(name) {
  if (!isValidSessionName(name)) throw new Error('Nome de sessão inválido')
}

// ~, ~/algo ou /algo; letras, números, espaço e . _ - / (sem aspas, $, `, etc.)
const CWD_RE = /^(~|~\/[A-Za-z0-9 ._/-]{0,255}|\/[A-Za-z0-9 ._/-]{0,255})$/

function isValidCwd(cwd) {
  return typeof cwd === 'string' && CWD_RE.test(cwd)
}

/** Pasta como expressão de shell: `~` vira "$HOME" (não expande entre aspas). */
function cwdExpr(cwd) {
  if (!isValidCwd(cwd)) throw new Error('Pasta inválida')
  if (cwd === '~') return '"$HOME"'
  if (cwd.startsWith('~/')) return `"$HOME"/${shq(cwd.slice(2))}`
  return shq(cwd)
}

/** Alvo exato (o `=` impede o tmux de casar agent-1 com agent-10). */
const sessionTarget = (name) => shq(`=${name}`)
const paneTarget = (name) => shq(`=${name}:`)

/** Imprime a versão se o tmux existe; sai com código != 0 se não. */
function checkCommand() {
  return 'command -v tmux >/dev/null 2>&1 && tmux -V'
}

/**
 * Comando do pty: cria ou entra na sessão (`new-session -A`). `exec` troca o
 * shell pelo tmux, então fechar o canal só desanexa — a sessão continua.
 * mouse on: o scroll (inclusive o swipe no celular) vira eventos do tmux.
 */
function attachCommand(name) {
  assertSessionName(name)
  return `exec ${TMUX} new-session -A -s ${shq(name)} \\; set-option -q mouse on`
}

function listCommand() {
  // Sem servidor tmux rodando o list-sessions falha: isso é "nenhuma sessão"
  return `${TMUX} list-sessions -F ${shq(LIST_FORMAT)} 2>/dev/null || true`
}

function createCommand(name, { cwd, claude, cols = 120, rows = 30 } = {}) {
  assertSessionName(name)
  const parts = [
    `${TMUX} new-session -d -s ${shq(name)}`,
    `-x ${Number(cols) | 0} -y ${Number(rows) | 0}`,
  ]
  if (cwd) parts.push(`-c ${cwdExpr(cwd)}`)
  parts.push(`\\; set-option -q mouse on`)
  let cmd = parts.join(' ')
  if (claude) {
    cmd += ` && ${TMUX} send-keys -t ${paneTarget(name)} claude Enter`
  }
  return cmd
}

function killCommand(name) {
  assertSessionName(name)
  return `${TMUX} kill-session -t ${sessionTarget(name)}`
}

function captureCommand(name) {
  assertSessionName(name)
  return `${TMUX} capture-pane -p -J -S -${CAPTURE_HISTORY} -t ${paneTarget(name)}`
}

function previewCommand(name) {
  assertSessionName(name)
  return `${TMUX} capture-pane -p -J -t ${paneTarget(name)}`
}

/** Saída do list-sessions → [{ name, created (ms), attached, command }]. */
function parseList(stdout) {
  const sessions = []
  for (const line of String(stdout).split('\n')) {
    if (!line.trim()) continue
    const [name, created, attached, ...rest] = line.split('|')
    if (!isValidSessionName(name)) continue // só as nossas
    sessions.push({
      name,
      created: Number(created) * 1000 || null,
      attached: Number(attached) || 0,
      command: rest.join('|').trim() || null,
    })
  }
  return sessions.sort(
    (a, b) => Number(a.name.slice(6)) - Number(b.name.slice(6)),
  )
}

/** Últimas N linhas com conteúdo (o pane visível termina em linhas vazias). */
function parsePreview(stdout, lines = PREVIEW_LINES) {
  const all = String(stdout).replace(/\s+$/, '').split('\n')
  return all.slice(-lines)
}

module.exports = {
  SOCKET,
  PREVIEW_LINES,
  shq,
  isValidCwd,
  cwdExpr,
  checkCommand,
  attachCommand,
  listCommand,
  createCommand,
  killCommand,
  captureCommand,
  previewCommand,
  parseList,
  parsePreview,
}
