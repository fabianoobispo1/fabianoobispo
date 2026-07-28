#!/bin/bash

# VPS Lab Server - Setup completo (tudo em um comando)
# Execute no seu VPS como root:
# bash vps-setup-completo.sh "sua-chave-super-secreta"

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Passe a chave como argumento"
  echo ""
  echo "Gere uma chave:"
  echo "  openssl rand -base64 32"
  echo ""
  echo "Depois execute:"
  echo "  bash vps-setup-completo.sh 'sua-chave-gerada'"
  exit 1
fi

API_KEY="$1"
LAB_DIR="/opt/lab-server"

echo "🚀 Iniciando setup completo do Lab Server..."
echo ""

# 1. Instalar Node.js
if ! command -v node &> /dev/null; then
  echo "📦 [1/5] Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y nodejs > /dev/null 2>&1
  echo "✅ Node.js instalado"
else
  echo "✅ [1/5] Node.js já instalado"
fi

# 2. Criar estrutura de diretórios
echo "📁 [2/5] Criando diretórios..."
sudo mkdir -p $LAB_DIR
sudo chown -R $(whoami) $LAB_DIR
echo "✅ Diretórios criados"

# 3. Instalar dependências npm
echo "📦 [3/5] Instalando dependências npm..."
cd $LAB_DIR
npm init -y > /dev/null 2>&1
npm install express dockerode dotenv uuid > /dev/null 2>&1
echo "✅ Dependências instaladas"

# 4. Criar arquivo .env
echo "🔐 [4/5] Configurando variáveis..."
cat > $LAB_DIR/.env << EOF
VPS_API_KEY=$API_KEY
PORT=3001
LAB_IMAGE=ubuntu:latest
EOF
chmod 600 $LAB_DIR/.env
echo "✅ .env configurado"

# 5. Download do script (usando curl)
echo "⬇️  [5/5] Baixando vps-lab-server.js..."
# Se disponível via GitHub
curl -fsSL https://raw.githubusercontent.com/fabianoobispo1/fabianoobispo/claude/todo-implementation-2yvvyi/scripts/vps-lab-server.js -o $LAB_DIR/vps-lab-server.js 2>/dev/null || {
  echo "⚠️  Não conseguiu baixar de GitHub"
  echo "   Copie manualmente: scp scripts/vps-lab-server.js usuario@seu-vps:$LAB_DIR/"
}
chmod +x $LAB_DIR/vps-lab-server.js
echo "✅ Script baixado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup concluído!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Próximas instruções:"
echo ""
echo "1️⃣  TESTE O SERVIDOR:"
echo "   cd $LAB_DIR"
echo "   node vps-lab-server.js"
echo "   (Ctrl+C para parar)"
echo ""
echo "2️⃣  CONFIGURE NO CONVEX (no seu projeto):"
echo "   npx convex env set VPS_API_URL http://seu-vps-ip:3001"
echo "   npx convex env set VPS_API_KEY $API_KEY"
echo ""
echo "3️⃣  CRIE SERVIÇO SYSTEMD (opcional, para auto-start):"
echo "   sudo bash scripts/vps-setup-systemd.sh"
echo ""
echo "4️⃣  TESTE A API:"
echo "   curl -H 'Authorization: Bearer $API_KEY' http://localhost:3001/api/health"
echo ""
echo "✨ Pronto! Agora rode 'npm run dev' no seu projeto."
echo ""
