#!/usr/bin/env node
/**
 * Teste de aceite da autenticação do Convex (fase 1). Roda SÓ contra o
 * deployment de dev (lê NEXT_PUBLIC_CONVEX_URL e CONVEX_AUTH_* do .env.local).
 *
 *   node scripts/convex-authz-smoke.mjs
 *   npx convex run user:deleteSmokeUsersInternal   # limpeza
 *
 * Verifica: sem token as funções sensíveis falham/retornam vazio; o _id de
 * outro usuário não dá acesso; nenhuma resposta contém `password`; token
 * assinado com outra chave é rejeitado.
 */
import { readFileSync } from 'node:fs'
import { generateKeyPairSync } from 'node:crypto'
import { ConvexHttpClient } from 'convex/browser'
import { anyApi as api } from 'convex/server'
import { SignJWT, importPKCS8 } from 'jose'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
    }),
)
const url = env.NEXT_PUBLIC_CONVEX_URL
if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL ausente no .env.local')
if (!(env.CONVEX_DEPLOYMENT ?? '').startsWith('dev:')) {
  throw new Error('Recusando: CONVEX_DEPLOYMENT não é dev:')
}

const pem = env.CONVEX_AUTH_PRIVATE_KEY.replace(/\\n/g, '\n')
const key = await importPKCS8(pem, 'ES256')
const sign = (sub, k = key) =>
  new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env.CONVEX_AUTH_KID, typ: 'JWT' })
    .setSubject(sub)
    .setIssuer(env.CONVEX_AUTH_ISSUER)
    .setAudience('convex')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(k)

const client = (token) => {
  const c = new ConvexHttpClient(url)
  if (token) c.setAuth(token)
  return c
}

let failures = 0
const ok = (name) => console.log(`  ✔ ${name}`)
const bad = (name, extra = '') => {
  failures++
  console.log(`  ✘ ${name} ${extra}`)
}
async function expectFail(name, fn) {
  try {
    const r = await fn()
    bad(name, `(não falhou: ${JSON.stringify(r)?.slice(0, 120)})`)
  } catch {
    ok(name)
  }
}
async function expectEmpty(name, fn) {
  try {
    const r = await fn()
    if (r === null || (Array.isArray(r) && r.length === 0)) ok(name)
    else bad(name, `(retornou dados: ${JSON.stringify(r).slice(0, 120)})`)
  } catch {
    ok(`${name} (falhou)`)
  }
}
const noPassword = (name, value) =>
  JSON.stringify(value ?? null).includes('"password"')
    ? bad(name, '(contém password)')
    : ok(name)

console.log(`Convex: ${url}`)

// ---------------------------------------------------------- sem sessão
console.log('\nSem token:')
const anon = client()
await expectFail('user.getAllUserRole', () =>
  anon.query(api.user.getAllUserRole, {}),
)
await expectFail('user.getAuthByEmailService', () =>
  anon.query(api.user.getAuthByEmailService, { email: 'x@y.z' }),
)
await expectFail('user.registerWithPasswordService', () =>
  anon.mutation(api.user.registerWithPasswordService, {
    nome: 'x',
    email: 'anon@smoke.invalid',
    passwordHash: 'x',
  }),
)
await expectEmpty('user.me', () => anon.query(api.user.me, {}))
await expectFail('todo.create', () =>
  anon.mutation(api.todo.create, { text: 'x' }),
)
await expectEmpty('todo.listMine', () => anon.query(api.todo.listMine, {}))
await expectFail('transaction.create', () =>
  anon.mutation(api.transaction.create, {
    name: 'x',
    type: 'EXPENSE',
    amount: 1,
    category: 'x',
    paymentMethod: 'PIX',
    date: Date.now(),
  }),
)
await expectEmpty('sshConnection.getConnectionsByUser', () =>
  anon.query(api.sshConnection.getConnectionsByUser, {}),
)
await expectFail('dontPad.listAll', () => anon.query(api.dontPad.listAll, {}))
await expectFail('megaSena.create', () =>
  anon.mutation(api.megaSena.create, {
    concurso: 1,
    data: 0,
    dezenas: [1, 2, 3, 4, 5, 6],
    ganhadores6: 0,
    rateio6: 0,
    ganhadores5: 0,
    rateio5: 0,
    ganhadores4: 0,
    rateio4: 0,
    acumulado6: 0,
    created_at: 0,
  }),
)
await expectFail('megaSena.fetchLatestFromCaixa', () =>
  anon.action(api.megaSena.fetchLatestFromCaixa, {}),
)
await expectFail('files.generateUploadUrl', () =>
  anon.mutation(api.files.generateUploadUrl, {}),
)
await expectFail('lab.createLab', () => anon.action(api.lab.createLab, {}))
await expectFail('categories.create', () =>
  anon.mutation(api.categories.create, {
    name: 'x',
    type: 'EXPENSE',
    active: true,
    created_at: 0,
    updated_at: 0,
  }),
)

// ------------------------------------------------- dois usuários comuns
console.log('\nDois usuários (A e B):')
const svc = client(await sign('service:next'))
const stamp = Date.now()
const regA = await svc.mutation(api.user.registerWithPasswordService, {
  nome: 'Smoke A',
  email: `a-${stamp}@smoke.invalid`,
  passwordHash: 'x',
})
const regB = await svc.mutation(api.user.registerWithPasswordService, {
  nome: 'Smoke B',
  email: `b-${stamp}@smoke.invalid`,
  passwordHash: 'x',
})
const A = client(await sign(regA.userId))
const B = client(await sign(regB.userId))

const meA = await A.query(api.user.me, {})
meA?._id === regA.userId
  ? ok('user.me identifica A')
  : bad('user.me identifica A')
noPassword('user.me sem password', meA)

const todoA = await A.mutation(api.todo.create, { text: 'segredo de A' })
await expectFail('B não remove todo de A', () =>
  B.mutation(api.todo.remove, { todoId: todoA }),
)
await expectFail('B não alterna todo de A', () =>
  B.mutation(api.todo.toggleTodoCompletion, { todoId: todoA }),
)
const listB = await B.query(api.todo.listMine, {})
listB.some((t) => t._id === todoA)
  ? bad('B não vê todo de A')
  : ok('B não vê todo de A')
await expectFail('usuário comum não lista usuários', () =>
  A.query(api.user.getAllUserRole, {}),
)
await expectFail('usuário comum não promove ninguém', () =>
  B.mutation(api.user.toggleUserRole, { targetUserId: regB.userId }),
)
await expectFail('usuário comum não chama função de serviço', () =>
  A.query(api.user.getAuthByEmailService, {
    email: `a-${stamp}@smoke.invalid`,
  }),
)
await expectEmpty('não-autorizado não vê conexões SSH', () =>
  A.query(api.sshConnection.getConnectionsByUser, {}),
)

// ------------------------------------------------- token forjado
console.log('\nToken assinado com outra chave:')
const { privateKey: otherKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})
const forged = client(await sign(regA.userId, otherKey))
await expectFail('token forjado é rejeitado', () =>
  forged.mutation(api.todo.create, { text: 'x' }),
)

await A.mutation(api.todo.remove, { todoId: todoA })
console.log(
  `\n${failures === 0 ? '✅ tudo ok' : `❌ ${failures} falha(s)`} — limpeza: npx convex run user:deleteSmokeUsersInternal`,
)
process.exit(failures ? 1 : 0)
