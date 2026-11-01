'use strict'

const crypto = require('crypto')

/**
 * Fingerprint no formato do OpenSSH (`ssh-keygen -lf`): SHA256 do blob da
 * host key em base64 sem padding. Compare com:
 *   ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
 */
function fingerprint(keyBlob) {
  const b64 = crypto.createHash('sha256').update(keyBlob).digest('base64')
  return `SHA256:${b64.replace(/=+$/, '')}`
}

const FINGERPRINT_RE = /^SHA256:[A-Za-z0-9+/]{43}$/

function isValidFingerprint(fp) {
  return typeof fp === 'string' && FINGERPRINT_RE.test(fp)
}

module.exports = { fingerprint, isValidFingerprint }
