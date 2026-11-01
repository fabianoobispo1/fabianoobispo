# Terminal web — instalação do Terminal Server no VPS

Guia de operação do terminal em `/dashboard/terminal`: arquitetura,
variáveis, chaves, TLS, tmux no host, deploy e diagnóstico. Uso no dia a
dia: [`TERMINAL_QUICK_START.md`](../TERMINAL_QUICK_START.md).

## Arquitetura

```
Navegador ──(sessão NextAuth)────────────> Next.js (Vercel)
Navegador ──GET /api/terminal/token──────> Next.js: token HMAC de 60 s, uso único
Navegador ──JWT ES256────────────────────> Convex: conexões salvas (credencial SELADA),
                                            metadados das sessões, host key fixada
Navegador ──wss:// (token na 1ª msg)─────> Terminal Server (Docker no VPS)
                                            └─ssh2─> host de destino ─> tmux -L webdeck
```

- WebSocket de longa duração não cabe em função serverless; por isso o
  Terminal Server é um container separado no VPS.
- **Credencial selada:** o navegador cifra senha/chave com a **chave
  pública** do Terminal Server (`crypto_box_seal`, libsodium) antes de
  salvar. O Convex e o Next.js guardam/repassam só o ciphertext; só o
  container (com `TERMINAL_PRIVATE_KEY`) abre. O conteúdo selado inclui
  host/porta/usuário e o dono — não dá para redirecionar a credencial
  para outro host nem usá-la com o token de outro usuário.
- **Host key fixada (TOFU):** na 1ª conexão a fingerprint do destino é
  gravada no Convex; nas seguintes, uma chave diferente é recusada
  (`host_key_mismatch`) até você confirmar na UI.
- **Sessões tmux persistentes:** cada janela é
  `tmux -L webdeck new-session -A -s agent-N` no host. Fechar a aba só
  desanexa; o processo continua rodando.
- Um WebSocket = uma conexão SSH com vários terminais multiplexados
  (protocolo v3, descrito no topo de `scripts/terminal-server/server.js`).

## Variáveis

### Next.js (`.env.local` e Vercel)

| Variável | Para quê |
|---|---|
| `TERMINAL_AUTHORIZED_EMAIL` | único e-mail com acesso. Sem ela a página fica desabilitada |
| `TERMINAL_TOKEN_SECRET` | segredo HMAC do token do WS — **igual** ao do container (≥ 32 chars) |
| `TERMINAL_VPS_WS_URL` | `wss://terminal.seu-dominio` (em dev: `ws://localhost:3002`) |
| `NEXT_PUBLIC_TERMINAL_PUBLIC_KEY` | chave pública X25519 (base64) usada para selar credenciais |

### Convex (`npx convex env set ...`, e `--prod` para produção)

| Variável | Para quê |
|---|---|
| `TERMINAL_AUTHORIZED_EMAIL` | o mesmo e-mail: as funções `sshConnection`/`terminalSession` só respondem a ele |
| `CONVEX_AUTH_ISSUER`, `CONVEX_AUTH_JWKS` | auth do Convex (fase 1, `node scripts/gen-convex-auth-keys.mjs`) |

### Terminal Server (`/opt/terminal-server/.env` no VPS, `chmod 600`)

Modelo completo em `scripts/terminal-server/.env.example`.

| Variável | Obrigatória | Para quê |
|---|---|---|
| `TERMINAL_TOKEN_SECRET` | sim | igual ao do Next.js |
| `ALLOWED_ORIGINS` | sim | origins aceitas no upgrade, ex.: `https://fabianoobispo.com.br,https://www.fabianoobispo.com.br` |
| `TERMINAL_PRIVATE_KEY` | p/ conexões salvas | par da `NEXT_PUBLIC_TERMINAL_PUBLIC_KEY` |
| `TERMINAL_AUTHORIZED_EMAIL` | recomendada | defesa extra: o e-mail do token precisa bater |
| `TLS_CERT` + `TLS_KEY` **ou** `ALLOW_INSECURE=1` | sim em produção | TLS no container, ou atrás de proxy com wss |
| `TRUST_PROXY=1` | atrás de proxy | IP real (`X-Forwarded-For`) nos logs |
| `ALLOWED_SSH_HOSTS` | não | lista de hosts de destino permitidos (vazio = qualquer) |
| `MAX_CONNECTIONS` / `MAX_CONNECTIONS_PER_USER` | não | 10 / 5 WebSockets |
| `MAX_CHANNELS_PER_CONNECTION` | não | terminais por WebSocket (8; sshd `MaxSessions` padrão é 10) |
| `MAX_PAYLOAD_BYTES` | não | tamanho máx. de mensagem (256 KiB) |
| `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PASSWORD` / `SSH_PRIVATE_KEY`, `SSH_PRIVATE_KEY_PASSPHRASE` | não | credencial padrão quando nenhuma conexão salva é escolhida |
| `SSH_HOST_FINGERPRINT` | não | fixa a host key da credencial padrão (`SHA256:...`) |

## 1. Gerar as chaves

Na sua máquina (raiz do repo):

```bash
node scripts/gen-terminal-keys.mjs   # par X25519 para selar credenciais
openssl rand -hex 32                 # TERMINAL_TOKEN_SECRET (se ainda não tiver)
```

- `NEXT_PUBLIC_TERMINAL_PUBLIC_KEY` → Vercel e `.env.local`
- `TERMINAL_PRIVATE_KEY` → só no `.env` do VPS. Nunca no repositório nem
  na Vercel.

> **Trocar o par de chaves invalida todas as credenciais salvas** (o
> container novo não abre o que foi selado com a chave antiga). Depois de
> trocar, redigite a senha/chave de cada conexão na aba "Conexões".

## 2. tmux no host de destino

As sessões persistentes dependem do tmux **no servidor ao qual você
conecta** (não no container):

```bash
sudo apt install tmux        # Debian/Ubuntu
sudo dnf install tmux        # Fedora/RHEL
```

Sem tmux o terminal funciona como shell comum (sem persistência) e a UI
mostra um aviso. O socket usado é `tmux -L webdeck`, separado do seu
tmux pessoal. Para ver as sessões direto no host:
`tmux -L webdeck ls` / `tmux -L webdeck attach -t agent-1`.

Para conferir a host key que a UI vai fixar:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

## 3. Deploy do container

Da sua máquina:

```bash
bash scripts/deploy-terminal-docker.sh usuario@seu-vps [porta]
```

O script copia `scripts/terminal-server/`, cria o `.env` na 1ª vez (com um
`TERMINAL_TOKEN_SECRET` novo — anote), constrói a imagem e sobe o
container com:

- usuário não-root (`USER node`), `--read-only`, `--tmpfs /tmp`,
  `--cap-drop ALL`, `--security-opt no-new-privileges`
- porta publicada **só em 127.0.0.1** (para ficar atrás do proxy TLS).
  Para TLS direto no container: `PUBLISH_ADDR=0.0.0.0` e `TLS_CERT`/`TLS_KEY`
  no `.env` (monte os certificados no container).

Depois edite `/opt/terminal-server/.env` (`ALLOWED_ORIGINS`,
`TERMINAL_AUTHORIZED_EMAIL`, `TERMINAL_PRIVATE_KEY`) e rode o script de
novo para recriar o container. Ele é idempotente.

> O protocolo mudou na versão 3.0.0: **o site e o container precisam ser
> atualizados juntos**. Um site novo com container antigo mostra
> "Versão do Terminal Server incompatível".

## 4. TLS (wss://) — obrigatório em produção

Sem TLS o container não sobe em produção, a menos que `ALLOW_INSECURE=1`
(use só atrás de um proxy com TLS e porta em 127.0.0.1).

### Caddy (certificado automático)

```caddy
terminal.seu-dominio.com {
    reverse_proxy 127.0.0.1:3002
}
```

### Nginx + Certbot

```nginx
server {
    listen 443 ssl;
    server_name terminal.seu-dominio.com;

    ssl_certificate     /etc/letsencrypt/live/terminal.seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/terminal.seu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;   # sessões longas
    }
}
```

```bash
sudo certbot --nginx -d terminal.seu-dominio.com
sudo nginx -t && sudo systemctl reload nginx
```

Depois: `TERMINAL_VPS_WS_URL=wss://terminal.seu-dominio.com` na Vercel.
O servidor manda ping a cada 30 s, o que mantém o proxy sem derrubar a
conexão ociosa.

## 5. Conferir

```bash
curl -s https://terminal.seu-dominio.com/health
# {"status":"ok","version":"3.0.0","protocol":3}
docker logs -f terminal-server
```

## Diagnóstico

Os logs são JSON, um evento por linha, **sem teclas nem credenciais**:

| Evento | Significado |
|---|---|
| `origin_rejected` | Origin fora de `ALLOWED_ORIGINS` (upgrade recusado com 403) |
| `auth_failed` (`reason`) | `timeout`, `no_auth_message`, `bad_signature` (segredo diferente do Next.js), `expired`, `replay`, `email_not_allowed` |
| `connection_rejected` | limite global (503) ou por usuário (4429) |
| `credential_rejected` | credencial selada com outra chave ou de outro dono |
| `host_rejected` | destino fora de `ALLOWED_SSH_HOSTS` |
| `host_key_mismatch` | a host key do destino mudou |
| `ssh_error` | falha de rede/autenticação SSH (`code`) |
| `session_start` / `session_end` | conexão SSH aberta/fechada (destino, duração) |
| `channel_open` / `channel_close` | terminal anexado/desanexado de uma sessão |
| `tmux_create` / `tmux_kill` | sessões criadas/encerradas pela UI |

Códigos de fechamento do WebSocket: `4401` token inválido, `4403` e-mail
não autorizado, `4429` muitas conexões.

Problemas comuns:

- **"Terminal desabilitado"** → falta `TERMINAL_AUTHORIZED_EMAIL` (Next.js).
- **"Terminal Server não configurado"** → falta `TERMINAL_VPS_WS_URL` ou
  `TERMINAL_TOKEN_SECRET` no Next.js.
- **Fecha na hora com 4401 e `bad_signature`** → segredos diferentes entre
  Vercel e VPS.
- **"Credencial inválida: ..."** → par de chaves trocado ou chave pública
  da Vercel diferente do par do VPS. Redigite a credencial.
- **"TERMINAL_PRIVATE_KEY não configurada"** → falta a chave privada no
  `.env` do VPS.
- **Aviso "tmux não está instalado no host"** → passo 2.
- **"Host key diferente da registrada"** → confira com `ssh-keygen -lf`;
  só clique "Confiar na nova chave" se reinstalou o servidor.

## Testes

```bash
cd scripts/terminal-server
npm ci && npm test        # unitários (token, nomes, origin, config, servidor)

# integração com SSH + tmux reais (opcional)
docker build -t webdeck-sshd-test test/sshd
docker run -d --rm --name wd-sshd -p 127.0.0.1:2222:22 webdeck-sshd-test
TEST_SSH_PORT=2222 npm test
docker stop wd-sshd
```

## Parar / remover

```bash
ssh usuario@seu-vps "docker rm -f terminal-server"
```

As sessões tmux no host continuam rodando; para encerrá-las:
`tmux -L webdeck kill-server` no host.
