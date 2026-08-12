# 🖥️ Terminal SSH - Setup e Uso

> ⚠️ **Arquitetura atualizada**: o Terminal Server (SSH real) roda como
> processo separado no VPS, não dentro do Next.js/Vercel — WebSocket de
> longa duração não funciona em serverless. Guia completo e atualizado:
> [`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md) e
> [`TERMINAL_QUICK_START.md`](TERMINAL_QUICK_START.md). O restante deste
> arquivo descreve o modelo de conexão única (via variáveis `SSH_*`), que
> hoje serve como **fallback** quando nenhuma conexão salva é selecionada
> — o app suporta múltiplas conexões salvas (aba "Conexões").

Este guia explica como configurar e usar o terminal web SSH seguro.

## 📋 Requisitos

- Docker no VPS (o Terminal Server roda em container — não precisa Node.js no host)
- Acesso SSH ao VPS
- Credenciais SSH (usuário + senha OU chave privada)

## 🚀 Instalação

### 1. Instalar Dependências

As dependências do terminal (`ws`, `ssh2`) ficam **só no Terminal Server,
no VPS** — não são instaladas no projeto Next.js principal. Veja
[`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md).

O frontend (`xterm`) já está em `package.json` deste repo.

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais SSH:

```env
# Email autorizado
TERMINAL_AUTHORIZED_EMAIL=seu-email@example.com

# Credenciais SSH
SSH_HOST=seu-vps.com
SSH_PORT=22
SSH_USER=root

# Escolha UM dos métodos:
# Opção A: Por senha
SSH_PASSWORD=sua_senha

# OU Opção B: Por chave privada (mais seguro)
SSH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...sua chave...
-----END RSA PRIVATE KEY-----"
```

### 3. Gerar Chave SSH (Recomendado)

Se não tem chave SSH, gere uma:

```bash
# Gerar chave de 4096 bits
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# Copiar chave pública para o VPS
ssh-copy-id -i ~/.ssh/id_rsa user@seu-vps.com

# Ler chave privada (para .env.local)
cat ~/.ssh/id_rsa
```

## 🔒 Segurança

### ⚠️ Importante

1. **Nunca commite `.env.local`** no repositório
2. **Use chave privada SSH** ao invés de senha
3. **Proteja a chave privada** com senha
4. **Restrinja acesso** usando `TERMINAL_AUTHORIZED_EMAIL`
5. **Use HTTPS** em produção
6. **Habilite logs** para auditoria

### Checklist de Segurança

- [ ] Arquivo `.env.local` está no `.gitignore`
- [ ] Email autorizado é específico (não genérico)
- [ ] SSH usa chave privada (não senha em texto plano)
- [ ] Chave privada tem senha de proteção
- [ ] Logs estão sendo registrados
- [ ] HTTPS está ativado em produção

## 📖 Como Usar

### Acessar o Terminal

1. Faça login no dashboard: `https://seu-site.com/entrar`
2. Navegue para: `https://seu-site.com/dashboard/terminal`
3. Clique em **"Conectar"**
4. Digite seus comandos normalmente

### Comandos Disponíveis

Qualquer comando shell do servidor:

```bash
# Listar arquivos
ls -la

# Verificar espaço em disco
df -h

# Ver processos
ps aux

# Editar arquivo
nano arquivo.txt

# Reiniciar serviço
systemctl restart nginx
```

### Atalhos do Terminal

| Atalho | Ação |
|--------|------|
| `Ctrl + C` | Interromper processo |
| `Ctrl + D` | Sair/Logout |
| `Ctrl + L` | Limpar tela |
| `↑` / `↓` | Histórico de comandos |
| `Tab` | Auto-complete |

## 🔧 Troubleshooting

### "Não consegue conectar"

1. Verifique se `SSH_HOST` e `SSH_PORT` estão corretos
2. Teste a conexão localmente: `ssh -p 22 user@host`
3. Verifique firewall/security groups

### "Autenticação falhou"

1. Confirme `SSH_USER` e `SSH_PASSWORD` (ou chave)
2. Teste: `ssh -i chave.pem user@host`
3. Verifique permissões da chave: `chmod 600 ~/.ssh/id_rsa`

### "Timeout da conexão"

1. Aumente `SSH_TIMEOUT` em `.env.local`
2. Verifique latência: `ping seu-vps.com`
3. Confira se o serviço SSH está rodando no VPS: `sudo service ssh status`

### "Terminal não aparece"

1. Abra DevTools (F12) e verifique erros no console
2. Confirme que xterm.js foi instalado
3. Verifique se a porta WebSocket está aberta

## 📊 Logs e Auditoria

Se `TERMINAL_LOG_CONNECTIONS=true`, os logs são salvos em:
```
logs/terminal-connections.log
```

Exemplo de log:
```
[2025-08-11 10:30:45] ✅ Conexão SSH estabelecida
User: fbc623@gmail.com | Host: exemplo.com | Port: 22
[2025-08-11 10:30:46] $ ls -la
[2025-08-11 10:31:00] ❌ Desconexão
```

## 🚀 Deploy em Produção

Este projeto é deployado na Vercel (não `npm start` num servidor próprio).
Checklist real:

1. **Terminal Server no VPS**: siga
   [`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md) (systemd +
   Nginx com TLS/WSS).
2. **Variáveis de ambiente na Vercel**: `TERMINAL_AUTHORIZED_EMAIL`,
   `TERMINAL_TOKEN_SECRET` (igual ao do VPS) e `TERMINAL_VPS_WS_URL`.
3. **Deploy**: `git push` (Vercel) — não precisa de `npm start` manual.

## 📚 Documentação Adicional

- [xterm.js Documentation](https://xtermjs.org/)
- [SSH2 Node Package](https://github.com/mscdex/ssh2)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs do terminal
2. Consulte a seção Troubleshooting
3. Abra uma issue no GitHub

---

**Última atualização:** 2025-08-11
**Versão:** 1.0.0
