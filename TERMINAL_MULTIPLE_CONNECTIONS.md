# Terminal web — conexões salvas e sessões

## Conexões (`convex/sshConnection.ts`)

Cada conexão tem nome, host, porta, usuário, método (senha ou chave
privada), descrição, tags, "padrão" e:

- `sealedCredential` — credencial selada no navegador (ver
  [`TERMINAL_SSH_SETUP.md`](TERMINAL_SSH_SETUP.md)); nunca volta para a UI.
- `hostKeyFingerprint` — host key fixada na 1ª conexão (`SHA256:...`).

| Função | Uso |
|---|---|
| `getConnectionsByUser`, `getConnectionById`, `getDefaultConnection` | listas sem segredos (`hasCredential`) |
| `getSealedCredential` | ciphertext para repassar ao Terminal Server |
| `createConnection`, `updateConnection`, `deleteConnection`, `updateLastUsed` | CRUD do dono; mudar host/porta/usuário/método exige nova credencial e limpa a host key |
| `pinHostKey`, `resetHostKey` | TOFU da host key |
| `countPlaintextSecretsInternal`, `purgePlaintextSecretsInternal` | migração do modelo antigo (só `npx convex run`) |

Sem conexão escolhida, o Terminal Server usa a credencial `SSH_*` do
próprio `.env` (`connectionKey = 'default'`).

## Sessões (`convex/terminalSession.ts`)

As sessões em si são do tmux no host (`agent-N`, socket `webdeck`) e
listadas pelo Terminal Server. No Convex ficam só os metadados da UI, por
usuário e por conexão:

| Campo | Regra |
|---|---|
| `apelido` | até 40 caracteres |
| `cor` | `slate`, `red`, `orange`, `amber`, `emerald`, `teal`, `sky`, `blue`, `violet`, `pink` |
| `pasta` | `~`, `~/…` ou `/…` (mesma regra do servidor) |

`listByConnection`, `upsert` (campo ausente = mantém; `null` = limpa) e
`remove`. Apagar uma conexão apaga os metadados dela.

O layout das janelas (posição, tamanho, minimizada) **não** vai para o
Convex: fica no `localStorage` do navegador
(`webdeck:layout:v1:<connectionKey>`).

## Migração do modelo antigo

Conexões criadas antes da fase 2 tinham a senha/chave em texto puro. Para
migrar um deployment:

```bash
npx convex run sshConnection:countPlaintextSecretsInternal [--prod]
npx convex run sshConnection:purgePlaintextSecretsInternal [--prod]
```

As conexões continuam na lista com o selo "Sem credencial"; edite cada
uma e digite a senha/chave de novo. Depois que todos os deployments
estiverem limpos, os campos `password`, `privateKey` e
`privateKeyPassphrase` podem sair do `convex/schema.ts`.

## Código

| Onde | O quê |
|---|---|
| `scripts/terminal-server/` | Terminal Server (protocolo v3, testes em `test/`) |
| `src/lib/terminal/connection.ts` | cliente do protocolo (sem React) |
| `src/lib/terminal/window-layout.ts` | geometria e persistência das janelas |
| `src/lib/terminal-crypto.ts` | selagem da credencial no navegador |
| `src/app/(dashboard)/dashboard/terminal/_components/` | página, gerenciador de conexões e `desktop/` (janelas, dock, paleta, modo celular) |
| `src/app/api/terminal/token/route.ts` | token do WebSocket |
