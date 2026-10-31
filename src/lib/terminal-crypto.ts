/**
 * Selagem das credenciais SSH no navegador (libsodium crypto_box_seal) com
 * a chave PÚBLICA do Terminal Server. O resultado vai para o Convex; só o
 * Terminal Server (TERMINAL_PRIVATE_KEY) consegue abrir.
 *
 * O payload inclui host/porta/usuário e o dono (userId): o servidor conecta
 * no host selado e exige dono == usuário do token.
 * Manter em sincronia com scripts/terminal-server/lib/sealed.js.
 */

export interface CredentialToSeal {
  owner: string
  host: string
  port: number
  username: string
  authMethod: 'password' | 'privateKey'
  password?: string
  privateKey?: string
  passphrase?: string
}

export function terminalPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_TERMINAL_PUBLIC_KEY?.trim() || null
}

export async function sealCredential(cred: CredentialToSeal): Promise<string> {
  const publicKeyB64 = terminalPublicKey()
  if (!publicKeyB64) {
    throw new Error(
      'NEXT_PUBLIC_TERMINAL_PUBLIC_KEY não configurada: não é possível salvar credenciais',
    )
  }

  // Import dinâmico: o libsodium só é baixado quando alguém salva uma conexão
  const { default: sodium } = await import('libsodium-wrappers')
  await sodium.ready

  const publicKey = sodium.from_base64(
    publicKeyB64,
    sodium.base64_variants.ORIGINAL,
  )
  if (publicKey.length !== sodium.crypto_box_PUBLICKEYBYTES) {
    throw new Error('NEXT_PUBLIC_TERMINAL_PUBLIC_KEY inválida')
  }

  const payload = JSON.stringify({
    v: 1,
    owner: cred.owner,
    host: cred.host,
    port: cred.port,
    username: cred.username,
    authMethod: cred.authMethod,
    ...(cred.authMethod === 'password'
      ? { password: cred.password }
      : {
          privateKey: cred.privateKey,
          passphrase: cred.passphrase || undefined,
        }),
  })

  const sealed = sodium.crypto_box_seal(sodium.from_string(payload), publicKey)
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL)
}
