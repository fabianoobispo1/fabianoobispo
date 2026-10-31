'use strict'

/**
 * Abre credenciais seladas pelo navegador (libsodium crypto_box_seal com a
 * chave pública do servidor). Só este processo tem TERMINAL_PRIVATE_KEY.
 *
 * Conteúdo esperado (JSON):
 *   { v: 1, owner, host, port, username, authMethod: 'password'|'privateKey',
 *     password?, privateKey?, passphrase? }
 * `owner` precisa ser igual ao `sub` do token: um ciphertext copiado de
 * outro usuário não serve.
 */

const sodium = require('libsodium-wrappers')

const HOST_RE = /^[a-zA-Z0-9.:_-]{1,253}$/
const USER_RE = /^[a-zA-Z0-9._-]{1,64}$/

async function createSealedOpener(privateKeyB64) {
  await sodium.ready
  if (!privateKeyB64) throw new Error('TERMINAL_PRIVATE_KEY ausente')
  const sk = sodium.from_base64(
    privateKeyB64.trim(),
    sodium.base64_variants.ORIGINAL,
  )
  if (sk.length !== sodium.crypto_box_SECRETKEYBYTES) {
    throw new Error('TERMINAL_PRIVATE_KEY com tamanho inválido')
  }
  const pk = sodium.crypto_scalarmult_base(sk)

  /** @returns {object} payload validado (lança em qualquer problema) */
  function open(sealedB64, expectedOwner) {
    if (typeof sealedB64 !== 'string' || sealedB64.length > 32_000) {
      throw new Error('credencial selada inválida')
    }
    let plain
    try {
      const cipher = sodium.from_base64(
        sealedB64,
        sodium.base64_variants.ORIGINAL,
      )
      plain = sodium.to_string(sodium.crypto_box_seal_open(cipher, pk, sk))
    } catch {
      throw new Error('não foi possível abrir a credencial selada')
    }

    let data
    try {
      data = JSON.parse(plain)
    } catch {
      throw new Error('credencial selada corrompida')
    }
    return validateCredential(data, expectedOwner)
  }

  return {
    open,
    publicKeyB64: sodium.to_base64(pk, sodium.base64_variants.ORIGINAL),
  }
}

function validateCredential(data, expectedOwner) {
  if (!data || data.v !== 1) throw new Error('versão de credencial inválida')
  if (data.owner !== expectedOwner) {
    throw new Error('credencial pertence a outro usuário')
  }
  if (typeof data.host !== 'string' || !HOST_RE.test(data.host)) {
    throw new Error('host inválido')
  }
  if (!Number.isInteger(data.port) || data.port < 1 || data.port > 65535) {
    throw new Error('porta inválida')
  }
  if (typeof data.username !== 'string' || !USER_RE.test(data.username)) {
    throw new Error('usuário inválido')
  }
  if (data.authMethod === 'password') {
    if (typeof data.password !== 'string' || !data.password) {
      throw new Error('senha ausente')
    }
  } else if (data.authMethod === 'privateKey') {
    if (typeof data.privateKey !== 'string' || !data.privateKey) {
      throw new Error('chave privada ausente')
    }
  } else {
    throw new Error('método de autenticação inválido')
  }
  return {
    host: data.host,
    port: data.port,
    username: data.username,
    authMethod: data.authMethod,
    password: data.authMethod === 'password' ? data.password : undefined,
    privateKey: data.authMethod === 'privateKey' ? data.privateKey : undefined,
    passphrase:
      typeof data.passphrase === 'string' && data.passphrase
        ? data.passphrase
        : undefined,
  }
}

module.exports = { createSealedOpener, validateCredential }
