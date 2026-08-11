# 🚀 Terminal SSH - Quick Start

Guia rápido para colocar o terminal em funcionamento em 5 minutos.

## ⚡ Instalação Rápida

### 1. Instalar Dependências

```bash
npm install xterm ssh2 ws
```

### 2. Configurar .env.local

```bash
# Copiar arquivo de exemplo
cp .env.local.example .env.local

# Editar com seus dados
nano .env.local
```

Adicione no mínimo:

```env
TERMINAL_AUTHORIZED_EMAIL=seu-email@example.com
SSH_HOST=seu-vps.com
SSH_PORT=22
SSH_USER=root
SSH_PASSWORD=sua_senha
# OU
SSH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

### 3. Testar

```bash
npm run dev
```

Acesse: `http://localhost:3000/dashboard/terminal`

## 📁 Arquivos Criados

```
src/
├── app/(dashboard)/dashboard/terminal/
│   ├── page.tsx                    # Página principal
│   └── _components/
│       └── terminal-client.tsx     # Componente do terminal
├── app/api/terminal/
│   ├── route.ts                    # API de autenticação
│   └── socket/route.ts             # API WebSocket
├── middleware/
│   └── email-protection.ts         # Middleware de segurança
├── services/
│   └── ssh-client.ts               # Serviço SSH
├── types/
│   └── terminal.ts                 # TypeScript types
├── config/
│   └── terminal-nav.ts             # Config de navegação
│
.env.local.example                  # Variáveis de ambiente
TERMINAL_SSH_SETUP.md              # Documentação completa
```

## 🔐 Adicionar ao Menu

Se seu projeto tem um menu de navegação, adicione:

```tsx
import { terminalNavItem } from '@/config/terminal-nav'

// Em seu arquivo de menu:
const navItems = [
  // ... outros items
  terminalNavItem,
]
```

## ✅ Checklist de Configuração

- [ ] `npm install xterm ssh2 ws` executado
- [ ] `.env.local` criado com credenciais SSH
- [ ] Email autorizado configurado
- [ ] Servidor Dev rodando (`npm run dev`)
- [ ] Terminal acessível em `/dashboard/terminal`
- [ ] Login funciona com email autorizado

## 🎯 Próximas Etapas

1. **Testar conexão SSH**
   - Execute `npm run dev`
   - Acesse o terminal
   - Clique em "Conectar"

2. **Configurar segurança avançada** (opcional)
   - Edite `src/middleware/email-protection.ts`
   - Adicione autenticação de 2 fatores
   - Configure IP whitelist

3. **Deploy em produção**
   - Use HTTPS (certificado SSL)
   - Configure variáveis de ambiente no servidor
   - Habilite logs (`TERMINAL_LOG_CONNECTIONS=true`)

4. **Monitorar e auditar**
   - Verifique logs de conexão
   - Configure alertas de segurança
   - Registre todas as atividades

## 🆘 Problemas Comuns

### Terminal não conecta

```bash
# Testar SSH localmente
ssh -p 22 -i ~/.ssh/id_rsa usuario@seu-vps.com

# Verificar se port 22 está aberto
telnet seu-vps.com 22
```

### Email não está autorizado

```env
# Verifique se o email está exato
TERMINAL_AUTHORIZED_EMAIL=seu-email@example.com
# (espaços ou maiúsculas fazem diferença)
```

### Dependências não instaladas

```bash
# Reinstalar
npm install
npm install xterm ssh2 ws --save

# Limpar cache
npm cache clean --force
```

## 📖 Documentação Completa

Leia `TERMINAL_SSH_SETUP.md` para:
- Segurança em produção
- Gerar chaves SSH
- Troubleshooting detalhado
- Deploy e monitoring

## 💡 Dicas Úteis

```bash
# Gerar chave SSH de 4096 bits
ssh-keygen -t rsa -b 4096

# Copiar chave para servidor
ssh-copy-id -i ~/.ssh/id_rsa user@servidor

# Testar com arquivo .pem
ssh -i chave.pem user@servidor
```

## 🎓 Exemplo de Uso

Após conectado:

```bash
# Listar arquivos
ls -la /home

# Ver versão do Node
node --version

# Verificar saúde do servidor
df -h
ps aux
```

---

**Sucesso! Terminal SSH está configurado! 🎉**

Para dúvidas, consulte `TERMINAL_SSH_SETUP.md`
