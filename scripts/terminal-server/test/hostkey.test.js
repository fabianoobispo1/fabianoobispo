'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')

const { fingerprint, isValidFingerprint } = require('../lib/hostkey')

test('fingerprint no formato do ssh-keygen (SHA256 base64 sem padding)', () => {
  const blob = Buffer.from('chave-de-teste')
  const expected =
    'SHA256:' +
    crypto.createHash('sha256').update(blob).digest('base64').replace(/=+$/, '')
  assert.equal(fingerprint(blob), expected)
  assert.equal(isValidFingerprint(fingerprint(blob)), true)
})

test('valida formato', () => {
  assert.equal(isValidFingerprint('SHA256:' + 'A'.repeat(43)), true)
  assert.equal(isValidFingerprint('MD5:aa:bb'), false)
  assert.equal(isValidFingerprint('SHA256:' + 'A'.repeat(44)), false)
  assert.equal(isValidFingerprint(undefined), false)
})
