#!/bin/bash

# Cria serviço systemd para Lab Server
# Execute como root no VPS:
# sudo bash vps-setup-systemd.sh

set -e

LAB_DIR="/opt/lab-server"
API_KEY=$(grep VPS_API_KEY $LAB_DIR/.env | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
  echo "❌ Erro: .env não encontrado em $LAB_DIR"
  echo "Execute vps-setup.sh primeiro"
  exit 1
fi

echo "🔧 Criando serviço systemd..."

sudo tee /etc/systemd/system/lab-server.service > /dev/null << EOF
[Unit]
Description=Lab Server - Docker Container Manager
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$LAB_DIR
ExecStart=/usr/bin/node $LAB_DIR/vps-lab-server.js
Restart=always
RestartSec=10

Environment="VPS_API_KEY=$API_KEY"
Environment="PORT=3001"
Environment="LAB_IMAGE=ubuntu:latest"

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable lab-server
sudo systemctl start lab-server

echo "✅ Serviço criado e iniciado!"
echo ""
echo "Comandos úteis:"
echo "  systemctl status lab-server"
echo "  systemctl restart lab-server"
echo "  journalctl -u lab-server -f"
