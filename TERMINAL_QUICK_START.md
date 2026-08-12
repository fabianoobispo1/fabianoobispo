# 🚀 Terminal SSH - Quick Start

> Guia completo e atualizado: [`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md).
> Este arquivo é só o resumo rápido.

## Como funciona hoje

O terminal roda em duas partes:

1. **Next.js** (`/dashboard/terminal`) — UI, autenticação (`protectByEmail`),
   gerenciamento de conexões salvas (Convex) e emissão de um token de
   acesso de curta duração.
2. **Terminal Server** (`scripts/vps-terminal-server.js`) — processo Node
   separado rodando **no seu VPS**, que abre a sessão SSH de verdade
   (via `ssh2`) e transmite tudo por WebSocket. Roda fora da Vercel porque
   funções serverless não suportam WebSocket de longa duração.

Sem o Terminal Server rodando e configurado, a tela do terminal abre
normalmente, mas o botão **Conectar** mostra um erro explicando o que falta.

## ⚡ Instalação Rápida

### 1. Deploy do Terminal Server (Docker) no VPS

Da sua máquina, na raiz do repo:

```bash
bash scripts/deploy-terminal-docker.sh usuario@seu-vps
```

Sobe um container `terminal-server` isolado (porta 3002 por padrão), sem
mexer em outros serviços do VPS. O script imprime o `TERMINAL_TOKEN_SECRET`
gerado — guarde-o.

Para produção, exponha em `wss://` via Nginx + certificado TLS — veja
[`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md).

### 2. No Next.js (`.env.local` e nas envs da Vercel)

```env
TERMINAL_AUTHORIZED_EMAIL=seu-email@example.com
TERMINAL_TOKEN_SECRET=seu-secret-gerado   # a MESMA chave do passo 1
TERMINAL_VPS_WS_URL=wss://terminal.seu-vps.com
```

### 3. Testar

```bash
npm run dev
```

Acesse `http://localhost:3000/dashboard/terminal`, salve uma conexão na aba
**Conexões** e clique em **Conectar**.

## 🔐 Menu lateral

O item **Terminal SSH** já está no menu (`src/components/app-sidebar.tsx`),
dentro do grupo "Administração" (visível só para usuários com
`role: 'admin'`).

## 🆘 Problemas comuns

Veja a seção de troubleshooting completa em
[`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md#-troubleshooting).
