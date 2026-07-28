# Labs - Quick Start

## ⚡ Setup em 5 minutos

### 1. Gere uma chave secreta

```bash
openssl rand -base64 32
# Copie a saída, ex: a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=
```

### 2. No VPS (execute como root ou com sudo)

```bash
# Clone/copie o arquivo do script
mkdir -p /opt/lab-server
cp scripts/vps-lab-server.js /opt/lab-server/

cd /opt/lab-server

# Instale Node.js se não tiver
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instale as dependências
npm init -y
npm install express dockerode dotenv uuid

# Crie o .env
cat > .env << EOF
VPS_API_KEY=a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK
PORT=3001
LAB_IMAGE=ubuntu:latest
EOF

# Teste rodando (Ctrl+C pra parar)
node vps-lab-server.js
# Esperado: "Lab Server rodando em http://127.0.0.1:3001"
```

### 3. Configure no Convex (dev)

```bash
# Na raiz do projeto
npx convex env set VPS_API_URL http://seu-vps-ip:3001
npx convex env set VPS_API_KEY a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK
```

### 4. Rode o dev

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Convex
npx convex dev
```

### 5. Acesse a página

```
http://localhost:3000/dashboard/labs
```

Clique em "Novo Lab" e pronto! 🎉

---

## 🔧 Para produção

```bash
# Configure em produção no Convex
npx convex env set VPS_API_URL https://seu-vps.com:3001 --prod
npx convex env set VPS_API_KEY a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK --prod

# Deploy Convex
npx convex deploy

# No VPS, crie um serviço systemd (veja LABS_SETUP.md)
```

---

## 🆘 Problemas?

- **SSH não conecta**: Aguarde 10 segundos, a imagem Ubuntu leva tempo pra iniciar SSH
- **API retorna 401**: Verifique se a chave está igual em ambos os lugares
- **"Limite de 3 labs atingido"**: Delete labs antigos ou aguarde auto-cleanup (2h)

Veja `docs/LABS_SETUP.md` para troubleshooting completo.
