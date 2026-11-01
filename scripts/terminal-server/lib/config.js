'use strict'

const { parseAllowedOrigins } = require('./origin')
const { clampInt } = require('./limits')
const { isValidFingerprint } = require('./hostkey')

/**
 * Lê e valida a configuração. Lança com a lista de problemas para o
 * processo não subir mal configurado.
 */
function loadConfig(env = process.env) {
  const errors = []
  const isProd = env.NODE_ENV === 'production'

  const tokenSecret = env.TERMINAL_TOKEN_SECRET
  if (!tokenSecret || tokenSecret.length < 32) {
    errors.push('TERMINAL_TOKEN_SECRET ausente ou curto (mín. 32 chars)')
  }

  let allowedOrigins = new Set()
  try {
    allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)
  } catch (err) {
    errors.push(err.message)
  }
  if (allowedOrigins.size === 0) {
    errors.push('ALLOWED_ORIGINS vazio (ex.: https://fabianoobispo.com.br)')
  }

  const tls =
    env.TLS_CERT && env.TLS_KEY
      ? { cert: env.TLS_CERT, key: env.TLS_KEY }
      : null
  const allowInsecure = env.ALLOW_INSECURE === '1'
  if (isProd && !tls && !allowInsecure) {
    errors.push(
      'Sem TLS em produção: defina TLS_CERT/TLS_KEY, ou ALLOW_INSECURE=1 se estiver atrás de um reverse proxy com wss (e publique a porta só em 127.0.0.1)',
    )
  }

  const allowedSshHosts = String(env.ALLOWED_SSH_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)

  const defaultSsh =
    env.SSH_HOST && env.SSH_USER && (env.SSH_PASSWORD || env.SSH_PRIVATE_KEY)
      ? {
          host: env.SSH_HOST,
          port: clampInt(env.SSH_PORT, 1, 65535, 22),
          username: env.SSH_USER,
          authMethod: env.SSH_PRIVATE_KEY ? 'privateKey' : 'password',
          password: env.SSH_PRIVATE_KEY ? undefined : env.SSH_PASSWORD,
          privateKey: env.SSH_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          passphrase: env.SSH_PRIVATE_KEY_PASSPHRASE || undefined,
          // Opcional: fixa a host key (ssh-keygen -lf ...pub → SHA256:...)
          hostFingerprint: env.SSH_HOST_FINGERPRINT?.trim() || undefined,
        }
      : null

  if (
    defaultSsh?.hostFingerprint &&
    !isValidFingerprint(defaultSsh.hostFingerprint)
  ) {
    errors.push('SSH_HOST_FINGERPRINT inválido (formato SHA256:...)')
  }

  if (errors.length) {
    const e = new Error(`Configuração inválida:\n - ${errors.join('\n - ')}`)
    e.errors = errors
    throw e
  }

  return {
    isProd,
    port: clampInt(env.PORT, 1, 65535, 3002),
    host: env.BIND_HOST || '0.0.0.0',
    tokenSecret,
    authorizedEmail:
      env.TERMINAL_AUTHORIZED_EMAIL?.trim().toLowerCase() || null,
    privateKey: env.TERMINAL_PRIVATE_KEY || null,
    allowedOrigins,
    allowedSshHosts,
    tls,
    trustProxy: env.TRUST_PROXY === '1',
    maxConnections: clampInt(env.MAX_CONNECTIONS, 1, 1000, 10),
    maxConnectionsPerUser: clampInt(env.MAX_CONNECTIONS_PER_USER, 1, 100, 5),
    maxPayload: clampInt(
      env.MAX_PAYLOAD_BYTES,
      1024,
      4 * 1024 * 1024,
      256 * 1024,
    ),
    // Terminais (canais pty) simultâneos por WebSocket; o sshd costuma
    // limitar a 10 sessões por conexão (MaxSessions)
    maxChannels: clampInt(env.MAX_CHANNELS_PER_CONNECTION, 1, 10, 8),
    authTimeoutMs: 5000,
    defaultSsh,
  }
}

module.exports = { loadConfig }
