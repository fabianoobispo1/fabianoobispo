# Labs - Ambientes de Teste Descartáveis

Sistema de labs interativos para criar ambientes temporários (containers Docker) para testes, sem afetar os outros serviços do VPS.

## 📋 Características

- ✅ Máximo 3 labs simultâneos por usuário
- ✅ 512 MB RAM, 0.2 CPU cada (isolamento de recursos)
- ✅ SSH em porta dedicada (2222+)
- ✅ Auto-apaga após 2 horas de inatividade
- ✅ Sem persistência de dados (containers descartáveis)
- ✅ Isolado em rede Docker separada

## 🚀 Setup

### 1. No VPS

#### Instale dependências

```bash
# Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Crie um diretório para o servidor
mkdir -p /opt/lab-server
cd /opt/lab-server
```

#### Configure o serviço

```bash
# Copie o script
cp scripts/vps-lab-server.js /opt/lab-server/

# Instale as dependências
npm init -y
npm install express dockerode dotenv uuid
```

#### Configure variáveis de ambiente

```bash
# Crie um arquivo .env
cat > /opt/lab-server/.env << EOF
VPS_API_KEY=sua-chave-secreta-super-longa
PORT=3001
LAB_IMAGE=ubuntu:latest
EOF

# Permissões
chmod 600 /opt/lab-server/.env
```

#### Crie um serviço systemd (opcional, mas recomendado)

```bash
# Crie o arquivo de serviço
sudo tee /etc/systemd/system/lab-server.service > /dev/null << EOF
[Unit]
Description=Lab Server - Docker Container Manager
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/lab-server
ExecStart=/usr/bin/node /opt/lab-server/vps-lab-server.js
Restart=always
RestartSec=10

Environment="VPS_API_KEY=sua-chave-secreta-super-longa"
Environment="PORT=3001"
Environment="LAB_IMAGE=ubuntu:latest"

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Ative o serviço
sudo systemctl daemon-reload
sudo systemctl enable lab-server
sudo systemctl start lab-server

# Verifique status
sudo systemctl status lab-server
```

#### Teste a API

```bash
# Health check
curl -H "Authorization: Bearer sua-chave-secreta-super-longa" \
  http://localhost:3001/api/health
```

### 2. No Convex (Backend)

Defina as variáveis de ambiente de produção:

```bash
npx convex env set VPS_API_URL https://seu-vps.com:3001
npx convex env set VPS_API_KEY sua-chave-secreta-super-longa

# Ou em produção
npx convex env set VPS_API_URL https://seu-vps.com:3001 --prod
npx convex env set VPS_API_KEY sua-chave-secreta-super-longa --prod
```

### 3. No Next.js (Frontend)

Nada precisa ser configurado! A página já está em:

```
/dashboard/labs
```

Acesse ela após fazer login.

## 🔧 Configuração avançada

### Usar imagem Docker customizada

```bash
# Se quiser usar uma imagem com SSH, Docker, etc. pré-instalado:
# 1. Crie um Dockerfile personalizado
# 2. Build a imagem
docker build -t lab-ubuntu:latest .
docker tag lab-ubuntu:latest seu-registry/lab-ubuntu:latest

# 3. Configure no .env
echo "LAB_IMAGE=seu-registry/lab-ubuntu:latest" >> /opt/lab-server/.env
```

### Aumentar limite de recursos

Edite `/opt/lab-server/vps-lab-server.js`:

```javascript
// Linha ~150
const container = await docker.createContainer({
  // ...
  HostConfig: {
    CpuQuotas: 400000, // Aumentar para 0.4 CPU
    Memory: 1024 * 1024 * 1024, // Aumentar para 1 GB RAM
    // ...
  },
})
```

### Customizar timeout de inatividade

Edite `convex/lab.ts`:

```typescript
export const cleanupInactiveLabs = action({
  handler: async (ctx) => {
    const TWO_HOURS = 2 * 60 * 60 * 1000 // Mudar para 6 * 60 * 60 * 1000 para 6 horas
    // ...
  },
})
```

## 🔐 Segurança

### Firewall (UFW)

```bash
# Permita SSH do VPS
sudo ufw allow from 127.0.0.1 to any port 3001

# Se acessar de fora (não recomendado), use um proxy reverso com Nginx:
# Veja NGINX_CONFIG.md
```

### Isolamento de rede

Os labs rodam em uma rede Docker separada (`labs-network`), isolados dos outros serviços.

### Limites de recursos

- CPU: 0.2 (configurável)
- RAM: 512 MB (configurável)
- Sem acesso ao socket Docker do host
- Sem acesso a volumes do host

## 📊 Monitoramento

### Ver containers em execução

```bash
docker network ls
docker ps -f label=managedBy=lab-server
```

### Ver logs do serviço

```bash
# Se usando systemd
sudo journalctl -u lab-server -f

# Se rodando manualmente
npm start
```

### API de health check

```bash
curl -H "Authorization: Bearer VPS_API_KEY" \
  http://seu-vps.com:3001/api/health
```

## 🐛 Troubleshooting

### "Limite de 3 labs atingido"

- Verifique se há labs órfãos: `docker ps -a -f label=managedBy=lab-server`
- Delete manualmente se necessário: `docker rm -f container-id`

### SSH não conecta

1. Verifique se o container está rodando: `docker ps`
2. Aguarde ~10 segundos após criar (SSH demora a iniciar)
3. Confira se a porta SSH está aberta: `sudo ufw status`
4. Teste conexão local primeiro: `ssh -p 2222 root@127.0.0.1`

### API retorna 401

Verifique se:

1. `VPS_API_KEY` no `.env` do VPS é igual ao do Convex
2. Header `Authorization: Bearer VPS_API_KEY` está sendo enviado
3. A chave não tem espaços extras

### Container não inicia

Verifique:

1. Imagem Docker existe: `docker images | grep ubuntu`
2. Memória disponível: `free -h`
3. Logs do Docker: `sudo journalctl -u docker -f`

## 🛑 Parar o serviço

```bash
# Se usando systemd
sudo systemctl stop lab-server
sudo systemctl disable lab-server

# Se rodando manualmente
# Ctrl + C

# Limpe containers órfãos
docker network rm labs-network
docker ps -a | grep lab- | awk '{print $1}' | xargs docker rm -f
```

## 📝 Roadmap

- [ ] Suporte a múltiplas imagens (escolha no frontend)
- [ ] Snapshots (salvar estado de um lab)
- [ ] File sharing (upload/download de arquivos)
- [ ] Web terminal (acesso via browser, sem SSH)
- [ ] Quotas por usuário (configurável)
- [ ] Integração com GitHub Gists (salvar historico)

---

**Dúvidas?** Verifique os logs e tente os passos de troubleshooting acima.
