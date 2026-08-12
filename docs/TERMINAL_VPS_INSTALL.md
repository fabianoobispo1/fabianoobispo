# 🖥️ Instalação do Terminal SSH no VPS - Guia Completo

## Por que precisa de um servidor separado no VPS?

O Terminal SSH usa um WebSocket de longa duração para transmitir o
shell interativo (teclas ↔ saída) em tempo real. Isso **não funciona em
funções serverless da Vercel** (onde o Next.js/API routes deste projeto
rodam) — a Vercel não mantém conexões WebSocket abertas. Por isso a
sessão SSH em si roda num container Docker separado, direto no seu VPS,
isolado dos demais serviços que já rodam lá.

Arquitetura:

```
Navegador ──(login/sessão)──> Next.js (Vercel)
Navegador ──(GET token curto)──> /api/terminal/token (Next.js, exige login autorizado)
Navegador ──(WebSocket ws(s)://, com o token)──> Terminal Server (container Docker no VPS) ──(ssh2)──> seu servidor SSH
```

O Next.js nunca vê o tráfego do terminal em si — ele só autentica o
usuário e emite um token de 60s. As credenciais SSH (senha/chave
privada) trafegam do navegador direto para o Terminal Server, no
momento de conectar.

## Pré-requisitos

- Docker instalado no VPS (Node.js **não** precisa estar instalado no
  host — roda tudo dentro do container)
- Uma porta livre no VPS para publicar o serviço (padrão: `3002`)

## ⚡ Instalação (1 comando)

Da sua máquina, na raiz deste repositório:

```bash
bash scripts/deploy-terminal-docker.sh usuario@seu-vps
```

Isso: cria `/opt/terminal-server` no VPS, envia os arquivos, gera um
`TERMINAL_TOKEN_SECRET` (se ainda não existir), builda a imagem Docker e
sobe o container `terminal-server` publicado na porta 3002 — sem tocar
em nenhum outro serviço/porta/container já existente no VPS.

Ao final, o script imprime o `TERMINAL_TOKEN_SECRET` gerado. Guarde-o.

**Antes de rodar num VPS com outros serviços**: confira se a porta
escolhida (`3002` por padrão, ou a que você passar como segundo
argumento) está livre — `ss -tlnp | grep 3002` no VPS.

## 🔧 Configure no Next.js

No `.env.local` (dev) e nas variáveis de ambiente do projeto na Vercel (produção):

```env
TERMINAL_AUTHORIZED_EMAIL=seu-email@example.com
TERMINAL_TOKEN_SECRET=<o secret impresso pelo script>
TERMINAL_VPS_WS_URL=ws://SEU_IP_OU_DOMINIO:3002   # troque para wss:// com TLS (veja abaixo)
```

Reinicie `npm run dev` (ou redeploy na Vercel) depois de configurar.

⚠️ **Sem TLS**: se o Next.js estiver rodando em `https://` (este projeto
usa `next dev --experimental-https`), o navegador bloqueia WebSocket
`ws://` por "mixed content". Pra testar localmente sem configurar TLS
ainda, rode o Next.js em `http://` nessa hora: adicione
`NEXTAUTH_URL=http://localhost:3000` no `.env.local` e rode
`npx next dev` (sem `--experimental-https`). Em produção (Vercel, que é
sempre HTTPS), o WebSocket **precisa** ser `wss://` — configure TLS
antes de usar em produção.

## 🔒 wss:// rápido com certificado autoassinado (teste, sem domínio)

Se você não tem domínio ainda mas precisa de `wss://` porque o site local
roda em `https://` (mixed content bloqueia `ws://`), gere um certificado
autoassinado direto no VPS e monte no container:

```bash
ssh usuario@seu-vps
cd /opt/terminal-server
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem \
  -days 3650 -nodes -subj "/CN=SEU_IP_OU_HOST"
echo "TLS_CERT=/certs/cert.pem" >> .env
echo "TLS_KEY=/certs/key.pem" >> .env
docker rm -f terminal-server
docker run -d --name terminal-server --restart unless-stopped \
  -p 3002:3002 -v /opt/terminal-server/certs:/certs:ro \
  --env-file .env terminal-server:latest
```

Defina `TERMINAL_VPS_WS_URL=wss://SEU_IP:3002`. Como o certificado não é
de uma CA confiável, **abra `https://SEU_IP:3002/health` direto no
navegador uma vez e aceite o aviso "não seguro"** — só depois disso o
navegador permite que o `wss://` da página do terminal conecte nesse
host. Isso é só para teste; em produção use certificado real (próxima
seção).

## 🔒 Exponha via HTTPS/WSS (Nginx) — necessário para produção

O container publica a porta diretamente (sem proxy). Para produção,
coloque um Nginx com certificado TLS (Certbot) na frente, sem publicar
a porta do container para fora (troque `-p 3002:3002` por
`-p 127.0.0.1:3002:3002` no `docker run`/script):

```nginx
server {
    listen 443 ssl;
    server_name terminal.seu-vps.com;

    ssl_certificate     /etc/letsencrypt/live/terminal.seu-vps.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/terminal.seu-vps.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s; # sessões SSH podem ficar abertas por muito tempo
    }
}
```

```bash
sudo certbot --nginx -d terminal.seu-vps.com
sudo nginx -t && sudo systemctl reload nginx
```

Depois troque `TERMINAL_VPS_WS_URL` para `wss://terminal.seu-vps.com`.

> Se o VPS já roda outro proxy (Nginx Proxy Manager, Traefik, etc.),
> use a ferramenta que já existe em vez de instalar Nginx cru — o
> importante é: TLS na porta pública + `Upgrade`/`Connection: upgrade`
> repassados para o container.

## 🔧 Troubleshooting

### "Terminal Server não configurado" ao clicar em Conectar

`TERMINAL_TOKEN_SECRET` ou `TERMINAL_VPS_WS_URL` não estão definidos no
ambiente do Next.js (local ou produção).

### WebSocket fecha na hora / erro 401

O secret do `.env` do VPS não bate com `TERMINAL_TOKEN_SECRET` do
Next.js, ou o token expirou (validade de 60s — clique em Conectar de novo).

### "Credenciais SSH ausentes"

Nenhuma conexão foi selecionada na aba **Conexões**, e o `.env` do VPS
não tem `SSH_HOST`/`SSH_USER`/`SSH_PASSWORD` (ou `SSH_PRIVATE_KEY`) como
fallback.

### Terminal conecta mas fecha na hora

```bash
docker logs terminal-server -f
```

Geralmente é autenticação SSH inválida (senha/chave errada) ou o host
alvo não aceita conexões na porta usada.

### Reconstruir/atualizar depois de mudar `scripts/vps-terminal-server.js`

```bash
bash scripts/deploy-terminal-docker.sh usuario@seu-vps
```

O script é idempotente: reconstrói a imagem e recria só o container
`terminal-server`, mantendo o `.env` (e o secret) existente.

## 🛑 Parar o serviço

```bash
ssh usuario@seu-vps "docker rm -f terminal-server"
```
