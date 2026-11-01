'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { parseAllowedOrigins, isOriginAllowed } = require('../lib/origin')

const allowed = parseAllowedOrigins(
  'https://fabianoobispo.com.br, https://www.fabianoobispo.com.br/',
)

test('normaliza a lista (barra final, espaços)', () => {
  assert.deepEqual(
    [...allowed],
    ['https://fabianoobispo.com.br', 'https://www.fabianoobispo.com.br'],
  )
})

test('aceita só origins da lista', () => {
  assert.equal(isOriginAllowed('https://fabianoobispo.com.br', allowed), true)
  for (const bad of [
    'http://fabianoobispo.com.br', // esquema diferente
    'https://fabianoobispo.com.br:8443', // porta diferente
    'https://evil.com',
    'https://fabianoobispo.com.br.evil.com',
    'https://evilfabianoobispo.com.br',
    'null', // iframe sandbox / file://
    '',
    undefined,
    'lixo',
  ]) {
    assert.equal(isOriginAllowed(bad, allowed), false, String(bad))
  }
})

test('recusa ALLOWED_ORIGINS com esquema que não é http(s)', () => {
  assert.throws(() => parseAllowedOrigins('ftp://x.com'))
  assert.throws(() => parseAllowedOrigins('não é url'))
})
