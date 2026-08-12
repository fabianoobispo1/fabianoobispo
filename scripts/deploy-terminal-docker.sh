#!/bin/bash

# Deploy do Terminal Server como container Docker no VPS.
# Rode a partir da sua máquina (raiz do repo), não no VPS:
#
#   bash scripts/deploy-terminal-docker.sh usuario@seu-vps [porta]
#
# Requisitos no VPS: Docker instalado. Não precisa de Node.js no host —
# tudo roda dentro do container.
#
# O script é seguro para rodar de novo (idempotente): reconstrói a imagem
# e recria só o container "terminal-server", sem tocar em mais nada.

set -e

TARGET="$1"
PORT="${2:-3002}"

if [ -z "$TARGET" ]; then
  echo "❌ Uso: bash scripts/deploy-terminal-docker.sh usuario@seu-vps [porta]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_DIR="/opt/terminal-server"

echo "📁 Criando $REMOTE_DIR em $TARGET..."
ssh "$TARGET" "mkdir -p $REMOTE_DIR"

echo "⬆️  Enviando arquivos..."
scp "$SCRIPT_DIR/vps-terminal-server.js" "$TARGET:$REMOTE_DIR/vps-terminal-server.js"
scp "$SCRIPT_DIR/terminal-server/Dockerfile" "$TARGET:$REMOTE_DIR/Dockerfile"
scp "$SCRIPT_DIR/terminal-server/package.json" "$TARGET:$REMOTE_DIR/package.json"

echo "🔐 Garantindo .env (gera TERMINAL_TOKEN_SECRET se ainda não existir)..."
ssh "$TARGET" bash -s <<EOF
set -e
cd $REMOTE_DIR
if [ ! -f .env ]; then
  SECRET=\$(openssl rand -base64 32)
  cat > .env << ENVEOF
TERMINAL_TOKEN_SECRET=\$SECRET
PORT=$PORT
ENVEOF
  chmod 600 .env
  echo "✅ .env criado. Guarde este secret para configurar no Next.js:"
  echo "TERMINAL_TOKEN_SECRET=\$SECRET"
else
  echo "ℹ️  .env já existe, mantendo o TERMINAL_TOKEN_SECRET atual."
fi
EOF

echo "🐳 Build + (re)start do container..."
ssh "$TARGET" bash -s <<EOF
set -e
cd $REMOTE_DIR
docker build -t terminal-server:latest .
docker rm -f terminal-server > /dev/null 2>&1 || true
docker run -d --name terminal-server --restart unless-stopped \
  -p $PORT:$PORT --env-file .env terminal-server:latest
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
echo "   TERMINAL_VPS_WS_URL=ws://SEU_IP_OU_DOMINIO:$PORT   (troque pra wss:// com TLS)"
echo ""
echo "⚠️  Sem TLS, o navegador só abre esse ws:// se o site também estiver em"
echo "   http:// (não https). Para produção, configure Nginx+TLS na frente"
echo "   e use wss:// — veja docs/TERMINAL_VPS_INSTALL.md."
