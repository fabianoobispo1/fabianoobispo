# 🚀 Instalação Labs no VPS - Guia Completo

## Pré-requisitos

- ✅ Acesso SSH ao VPS com privilégio `sudo`
- ✅ Docker instalado (`docker --version`)
- ✅ Seu projeto com a feature de Labs

## ⚡ Instalação (3 passos)

### Passo 1: Gere uma chave secreta

Execute no seu PC (ou qualquer lugar):

```bash
openssl rand -base64 32
```

**Copie a saída**, exemplo:
```
a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=
```

---

### Passo 2: Execute setup no VPS

Conecte no seu VPS via SSH:

```bash
ssh seu-usuario@seu-vps.com
sudo su -  # Entre como root
```

Agora copie e cole **um dos comandos abaixo**:

#### **Opção A: Script completo automático** (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/fabianoobispo1/fabianoobispo/claude/todo-implementation-2yvvyi/scripts/vps-setup-completo.sh | bash -s "a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK="
```

Substitua `a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=` pela sua chave gerada.

#### **Opção B: Passo a passo manual**

```bash
# 1. Criar diretório
sudo mkdir -p /opt/lab-server
cd /opt/lab-server

# 2. Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar dependências
npm init -y
npm install express dockerode dotenv uuid

# 4. Criar arquivo .env
cat > .env << EOF
VPS_API_KEY=a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=
PORT=3001
LAB_IMAGE=ubuntu:latest
EOF
chmod 600 .env

# 5. Copiar script (você copia via SCP, ou cria manualmente)
# Opção: scp scripts/vps-lab-server.js seu-usuario@seu-vps:/opt/lab-server/
# OU crie manualmente copiando o conteúdo de scripts/vps-lab-server.js
```

---

### Passo 3: Teste localmente no VPS

Ainda conectado no VPS:

```bash
cd /opt/lab-server
node vps-lab-server.js
```

Esperado:
```
Lab Server rodando em http://127.0.0.1:3001
VPS_API_KEY: a3kL9x2mN8pQ5wR4tY7...
```

Teste em outra aba do SSH:

```bash
curl -H "Authorization: Bearer a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=" \
  http://localhost:3001/api/health
```

Esperado:
```json
{"status":"ok","version":"1.0.0"}
```

✅ Se funcionou, volte para o terminal anterior e pressione `Ctrl+C` para parar.

---

## 🔧 Configure no seu projeto

De volta ao seu PC, no repositório:

```bash
# 1. Configure Convex (dev)
npx convex env set VPS_API_URL http://seu-vps-ip:3001
npx convex env set VPS_API_KEY a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK=

# 2. Rode o dev
npm run dev

# 3. Em outro terminal
npx convex dev

# 4. Em outro terminal no VPS
cd /opt/lab-server && node vps-lab-server.js
```

Acesse: `http://localhost:3000/dashboard/labs` 🎉

---

## ⚙️ Setup Permanente (Systemd)

Para o Lab Server rodar automaticamente após reiniciar o VPS:

```bash
# No VPS
cd /opt/lab-server
sudo bash scripts/vps-setup-systemd.sh
```

Comandos úteis:

```bash
# Status
sudo systemctl status lab-server

# Logs
sudo journalctl -u lab-server -f

# Reiniciar
sudo systemctl restart lab-server

# Parar
sudo systemctl stop lab-server
```

---

## 🌐 Para Produção (Vercel)

Quando quiser colocar em produção:

```bash
# Configure em produção no Convex
npx convex env set VPS_API_URL https://seu-vps.com:3001 --prod
npx convex env set VPS_API_KEY a3kL9x2mN8pQ5wR4tY7uV6zX1cB9jD2e3fH4gI5jK= --prod

# Deploy Convex
npx convex deploy
```

⚠️ **Importante**: Seu VPS precisa ter HTTPS ou proxy reverso para funcionar em produção.

---

## 🆘 Troubleshooting

### "Connection refused" ao conectar

```bash
# Verifique se o Lab Server está rodando
cd /opt/lab-server
ps aux | grep node

# Se não estiver, inicie manualmente
node vps-lab-server.js
```

### "Unauthorized" na API

```bash
# Verifique se a chave está igual em ambos os lugares
cat /opt/lab-server/.env
npx convex env list
```

### "No such image: ubuntu:latest"

```bash
# Docker não tem a imagem Ubuntu
docker pull ubuntu:latest

# Depois reinicie o Lab Server
```

### SSH não conecta ao container

```bash
# Aguarde 10 segundos após criar (SSH demora a iniciar)
# Teste: ssh -p 2222 -o ConnectTimeout=5 root@seu-vps
```

---

## 📊 Monitorar Labs

```bash
# Ver containers rodando
docker ps -f label=managedBy=lab-server

# Ver rede Docker
docker network ls | grep labs-network

# Ver logs de um container específico
docker logs -f container-id
```

---

## 🗑️ Limpar (se precisar resetar)

```bash
# Parar o Lab Server
sudo systemctl stop lab-server  # ou Ctrl+C

# Remover todos os containers
docker ps -a -f label=managedBy=lab-server -q | xargs docker rm -f

# Remover rede
docker network rm labs-network

# Remover aplicação
sudo rm -rf /opt/lab-server
```

---

**Pronto! Seu Lab Server está rodando.** 🚀

Qualquer dúvida, verifique os logs ou abra uma issue.
