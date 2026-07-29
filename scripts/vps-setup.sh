#!/bin/bash

# VPS Lab Server - Setup automático
# Execute no seu VPS como root:
# bash vps-setup.sh "sua-chave-secreta-aqui"

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Passe a chave como argumento"
  echo "Uso: bash vps-setup.sh 'sua-chave-secreta'"
  exit 1
fi

API_KEY="$1"
LAB_DIR="/opt/lab-server"

echo "🚀 Configurando Lab Server no VPS..."

# 1. Instalar Node.js se não tiver
if ! command -v node &> /dev/null; then
  echo "📦 Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 2. Criar diretório
echo "📁 Criando diretório $LAB_DIR..."
sudo mkdir -p $LAB_DIR
sudo chown -R $(whoami) $LAB_DIR

# 3. Instalar dependências npm
echo "📦 Instalando dependências npm..."
cd $LAB_DIR
npm init -y > /dev/null 2>&1
npm install express dockerode dotenv uuid --silent

# 4. Criar .env
echo "🔐 Criando arquivo .env..."
cat > $LAB_DIR/.env << EOF
VPS_API_KEY=$API_KEY
PORT=3001
LAB_IMAGE=ubuntu:latest
EOF

chmod 600 $LAB_DIR/.env

# 5. Copiar script (você precisa fazer isso manualmente ou via SCP)
echo "⚠️  Próximo passo:"
echo "   scp scripts/vps-lab-server.js seu-usuario@seu-vps:$LAB_DIR/"

# 6. Testar
echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para testar, execute:"
echo "   cd $LAB_DIR"
echo "   node vps-lab-server.js"
echo ""
echo "Para criar serviço systemd, execute:"
echo "   bash vps-setup-systemd.sh"
