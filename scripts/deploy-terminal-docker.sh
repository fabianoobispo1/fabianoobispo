#!/bin/bash

# Deploy do Terminal Server como container Docker no VPS.
# Rode a partir da sua máquina (raiz do repo), não no VPS:
#
#   bash scripts/deploy-terminal-docker.sh usuario@seu-vps [porta]
#
# Por padrão a porta é publicada só em 127.0.0.1 (uso atrás de um reverse
# proxy com TLS — Nginx/Caddy — servindo wss://). Para expor direto com
# TLS no próprio container: PUBLISH_ADDR=0.0.0.0 e TLS_CERT/TLS_KEY no .env.
#
# Requisitos no VPS: Docker instalado. Não precisa de Node.js no host —
# tudo roda dentro do container.
#
# O script é seguro para rodar de novo (idempotente): reconstrói a imagem
# e recria só o container "terminal-server", sem tocar em mais nada.

set -e

TARGET="$1"
PORT="${2:-3002}"
PUBLISH_ADDR="${PUBLISH_ADDR:-127.0.0.1}"

if [ -z "$TARGET" ]; then
  echo "❌ Uso: bash scripts/deploy-terminal-docker.sh usuario@seu-vps [porta]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_DIR="/opt/terminal-server"

echo "📁 Criando $REMOTE_DIR em $TARGET..."
ssh "$TARGET" "mkdir -p $REMOTE_DIR"

echo "⬆️  Enviando arquivos..."
ssh "$TARGET" "mkdir -p $REMOTE_DIR/lib"
scp "$SCRIPT_DIR/terminal-server/server.js" \
    "$SCRIPT_DIR/terminal-server/Dockerfile" \
    "$SCRIPT_DIR/terminal-server/.dockerignore" \
    "$SCRIPT_DIR/terminal-server/package.json" \
    "$SCRIPT_DIR/terminal-server/package-lock.json" \
    "$TARGET:$REMOTE_DIR/"
scp "$SCRIPT_DIR"/terminal-server/lib/*.js "$TARGET:$REMOTE_DIR/lib/"
# Versão antiga (arquivo único) não é mais usada
ssh "$TARGET" "rm -f $REMOTE_DIR/vps-terminal-server.js"

echo "🔐 Garantindo .env (gera TERMINAL_TOKEN_SECRET se ainda não existir)..."
ssh "$TARGET" bash -s <<EOF
set -e
cd $REMOTE_DIR
if [ ! -f .env ]; then
  SECRET=\$(openssl rand -base64 32)
  cat > .env << ENVEOF
TERMINAL_TOKEN_SECRET=\$SECRET
PORT=$PORT
# Obrigatórias — preencha antes de usar:
ALLOWED_ORIGINS=https://fabianoobispo.com.br
TERMINAL_AUTHORIZED_EMAIL=
# Gere com: node scripts/gen-terminal-keys.mjs (na sua máquina)
TERMINAL_PRIVATE_KEY=
# Atrás de reverse proxy com wss (porta publicada só em 127.0.0.1):
ALLOW_INSECURE=1
TRUST_PROXY=1
ENVEOF
  chmod 600 .env
  echo "✅ .env criado. Guarde este secret para configurar no Next.js:"
  echo "TERMINAL_TOKEN_SECRET=\$SECRET"
  echo "⚠️  Edite $REMOTE_DIR/.env: ALLOWED_ORIGINS, TERMINAL_AUTHORIZED_EMAIL e TERMINAL_PRIVATE_KEY."
else
  echo "ℹ️  .env já existe, mantendo o TERMINAL_TOKEN_SECRET atual."
  for VAR in ALLOWED_ORIGINS TERMINAL_PRIVATE_KEY; do
    grep -q "^\$VAR=." .env || echo "⚠️  \$VAR não está definida em $REMOTE_DIR/.env"
  done
fi
EOF

echo "🐳 Build + (re)start do container..."
ssh "$TARGET" bash -s <<EOF
set -e
cd $REMOTE_DIR
docker build -t terminal-server:latest .
docker rm -f terminal-server > /dev/null 2>&1 || true
docker run -d --name terminal-server --restart unless-stopped \
  --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
  -p $PUBLISH_ADDR:$PORT:$PORT --env-file .env terminal-server:latest
EOF

echo ""
echo "✅ Deploy concluído! Testando /health..."
sleep 2
ssh "$TARGET" "curl -sf http://127.0.0.1:$PORT/health && echo" || {
  echo "⚠️  /health não respondeu. Veja: docker logs terminal-server"
  exit 1
}

echo ""
echo "📌 Próximo passo: configure no Next.js (.env.local e/ou Vercel):"
echo "   TERMINAL_TOKEN_SECRET=<o secret mostrado acima ou já configurado>"
echo "   TERMINAL_VPS_WS_URL=wss://SEU_DOMINIO   (reverse proxy com TLS na frente)"
echo "   NEXT_PUBLIC_TERMINAL_PUBLIC_KEY=<par da TERMINAL_PRIVATE_KEY>"
echo ""
echo "ℹ️  Veja docs/TERMINAL_VPS_INSTALL.md para o Nginx/Caddy com wss://."
