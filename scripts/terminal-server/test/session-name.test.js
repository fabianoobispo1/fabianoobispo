'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  isValidSessionName,
  nextSessionName,
  isValidChannelId,
} = require('../lib/session-name')
const tmux = require('../lib/tmux')

test('aceita só agent-<número>', () => {
  for (const ok of ['agent-1', 'agent-0', 'agent-42', 'agent-999999']) {
    assert.equal(isValidSessionName(ok), true, ok)
  }
  for (const bad of [
    'agent-',
    'agent-1a',
    'Agent-1',
    'agent-1 ',
    ' agent-1',
    'agent-1\n',
    'agent--1',
    'agent-1234567', // mais de 6 dígitos
    'agent-1;id',
    'agent-$(id)',
    "agent-1'",
    'main',
    '',
    null,
    undefined,
    1,
    ['agent-1'],
  ]) {
    assert.equal(isValidSessionName(bad), false, JSON.stringify(bad))
  }
})

test('próximo nome livre ignora nomes estranhos', () => {
  assert.equal(nextSessionName([]), 'agent-1')
  assert.equal(nextSessionName(['agent-1', 'agent-7', 'agent-3']), 'agent-8')
  assert.equal(nextSessionName(['foo', 'agent-x', 'agent-2']), 'agent-3')
})

test('ids de canal', () => {
  assert.equal(isValidChannelId('c1'), true)
  assert.equal(isValidChannelId('a'.repeat(33)), false)
  assert.equal(isValidChannelId('c 1'), false)
  assert.equal(isValidChannelId(1), false)
})

test('comandos tmux recusam nome inválido (nunca interpolam)', () => {
  for (const fn of [
    tmux.attachCommand,
    tmux.killCommand,
    tmux.captureCommand,
    tmux.previewCommand,
    (n) => tmux.createCommand(n),
  ]) {
    assert.throws(() => fn('agent-1; rm -rf /'), /inválido/)
    assert.throws(() => fn("agent-1' && id #"), /inválido/)
  }
})

test('comandos tmux usam o socket dedicado e alvo exato', () => {
  assert.match(
    tmux.attachCommand('agent-3'),
    /^exec tmux -L webdeck new-session -A -s 'agent-3'/,
  )
  assert.match(tmux.killCommand('agent-1'), /kill-session -t '=agent-1'$/)
  assert.match(
    tmux.captureCommand('agent-1'),
    /capture-pane -p -J -S -5000 -t '=agent-1:'$/,
  )
  assert.match(
    tmux.createCommand('agent-2', { claude: true }),
    /&& tmux -L webdeck send-keys -t '=agent-2:' claude Enter$/,
  )
})

test('pasta: charset restrito e sempre entre aspas', () => {
  assert.equal(tmux.cwdExpr('~'), '"$HOME"')
  assert.equal(tmux.cwdExpr('~/meu app'), `"$HOME"/'meu app'`)
  assert.equal(tmux.cwdExpr('/srv/app'), `'/srv/app'`)
  for (const bad of [
    "/tmp'; id; '",
    '/tmp/$(id)',
    '/tmp/`id`',
    'relativo',
    '~root',
    '/a\nb',
    '/' + 'a'.repeat(300),
  ]) {
    assert.equal(tmux.isValidCwd(bad), false, bad)
    assert.throws(() => tmux.cwdExpr(bad))
  }
})

test('shq escapa aspas simples', () => {
  assert.equal(tmux.shq("a'b"), `'a'\\''b'`)
})

test('parseList filtra sessões de fora e ordena por número', () => {
  const out = [
    'agent-10|1700000000|0|bash',
    'pessoal|1700000000|1|vim',
    'agent-2|1700000001|1|node|x',
    '',
  ].join('\n')
  assert.deepEqual(tmux.parseList(out), [
    { name: 'agent-2', created: 1700000001000, attached: 1, command: 'node|x' },
    { name: 'agent-10', created: 1700000000000, attached: 0, command: 'bash' },
  ])
})

test('parsePreview devolve as últimas 8 linhas sem o vazio do fim', () => {
  const lines = Array.from({ length: 20 }, (_, i) => `l${i}`)
  const out = lines.join('\n') + '\n\n\n'
  assert.deepEqual(tmux.parsePreview(out), lines.slice(-8))
})
