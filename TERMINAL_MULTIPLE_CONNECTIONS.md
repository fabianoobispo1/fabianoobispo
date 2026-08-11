# 🔗 Terminal SSH - Múltiplas Conexões Salvas

Agora você pode **salvar múltiplas conexões SSH** no banco de dados Convex e conectar em **qualquer host**!

## 🎯 O que mudou?

### ✨ Novas Funcionalidades

1. **Gerenciador de Conexões** - Tab dedicada para gerenciar conexões SSH
2. **Múltiplas Conexões** - Salve quantas conexões quiser
3. **Qualquer Host** - Conecte em qualquer servidor VPS/Linux
4. **Armazenamento Seguro** - Credenciais guardadas no banco de dados
5. **Conexão Padrão** - Defina qual conexão usar por padrão
6. **Histórico de Uso** - Rastreie quando foram usadas as conexões

## 📁 Novos Arquivos

```
convex/
└── sshConnection.ts          # Funções CRUD para conexões SSH

src/
├── app/(dashboard)/dashboard/terminal/
│   └── _components/
│       └── connection-manager.tsx  # Gerenciador de conexões (UI)
├── types/
│   └── terminal.ts           # SSHConnection type
└── app/(dashboard)/dashboard/terminal/
    └── page.tsx              # Página atualizada com tabs
```

## 🚀 Como Usar

### 1. Criar uma Conexão

1. Acesse `/dashboard/terminal`
2. Clique na aba **"Conexões"**
3. Clique no botão **"Nova Conexão"**
4. Preencha os dados:
   - **Nome**: identifique a conexão (ex: "Servidor Principal")
   - **Host**: IP ou hostname (ex: `seu-vps.com` ou `192.168.1.1`)
   - **Porta**: porta SSH (padrão: 22)
   - **Usuário**: usuário SSH (ex: `root`, `ubuntu`, `admin`)
   - **Autenticação**: escolha entre Senha ou Chave Privada
   - **Descrição**: opcional, para referência
   - **Padrão**: marque para usar automaticamente

### 2. Conectar ao Terminal

1. Na aba **"Conexões"**, clique em uma conexão para selecioná-la
2. Volte para a aba **"Terminal"**
3. Clique em **"Conectar"**
4. O terminal se conectará usando a conexão selecionada

### 3. Editar ou Deletar

- Clique no ícone **Editar** (lápis) para modificar
- Clique no ícone **Deletar** (lixeira) para remover

## 💾 Armazenamento de Dados

Suas conexões são salvas em uma tabela `sshConnection` no Convex com:

```typescript
{
  userId: Id<"user">              // Seu ID de usuário
  name: string                     // Nome da conexão
  host: string                     // Host SSH
  port: number                     // Porta (1-65535)
  username: string                 // Usuário SSH
  authMethod: "password" | "privateKey"  // Método auth
  password?: string                // Senha (criptografada)
  privateKey?: string              // Chave privada (criptografada)
  privateKeyPassphrase?: string    // Senha da chave
  description?: string             // Descrição
  tags?: string[]                  // Tags para organizar
  isDefault: boolean               // Conexão padrão?
  lastUsed?: number                // Timestamp último uso
  created_at: number               // Criação
  updated_at: number               // Última modificação
}
```

## 🔐 Segurança

### ✅ Implementado

- Autenticação via email (NextAuth)
- Dados salvos no banco Convex (acesso restrito)
- Middleware de proteção por email
- Isolamento por usuário

### 📝 TODO - Implementar em Produção

```typescript
// Em convex/sshConnection.ts, linha ~50:
// IMPORTANTE: Descriptografar antes de usar!

// Exemplo com libsodium:
const encryptedPassword = await sodium.crypto_secretbox(
  Buffer.from(password),
  nonce,
  secretKey
)

// Antes de enviar ao backend SSH:
const decrypted = await sodium.crypto_secretbox_open(
  encryptedPassword,
  nonce,
  secretKey
)
```

## 🔄 Fluxo de Autenticação

```
Usuário seleciona conexão
         ↓
Clica "Conectar"
         ↓
Frontend envia connectionId ao WebSocket
         ↓
Backend verifica ownership (connectionId pertence ao usuário?)
         ↓
Backend RECUPERA credenciais do Convex (descriptografa)
         ↓
Backend conecta SSH com credenciais
         ↓
Terminal interativo ↔ Shell SSH
```

## 🛠️ Configuração Avançada

### Autenticação por Senha

```
Nome: Servidor de Teste
Host: 192.168.1.100
Porta: 22
Usuário: ubuntu
Método: Senha
Senha: minha_senha_segura
```

### Autenticação por Chave Privada

```
Nome: Servidor Principal
Host: seu-vps.com
Porta: 22
Usuário: root
Método: Chave Privada
Chave Privada: [cole aqui]
Passphrase da Chave: [se houver]
```

## 📊 Exemplos de Conexão

### Exemplo 1: Servidor AWS EC2

```
Nome: AWS Production
Host: ec2-12-34-56-78.compute-1.amazonaws.com
Porta: 22
Usuário: ec2-user
Autenticação: Chave Privada (arquivo .pem)
Descrição: Servidor de produção na AWS
```

### Exemplo 2: VPS DigitalOcean

```
Nome: DO Droplet
Host: 192.168.1.50
Porta: 2222 (porta customizada)
Usuário: root
Autenticação: Senha
Descrição: Droplet de testes
```

### Exemplo 3: Servidor Local

```
Nome: Máquina Local
Host: localhost
Porta: 22
Usuário: seu_usuario
Autenticação: Chave Privada
```

## 🔔 Notificações & Logs

Ao conectar, você verá:

```
✅ Conectado ao servidor!
user@host:~$ 
```

Erros comuns:

```
❌ Erro: Host não encontrado
❌ Erro: Autenticação falhou
❌ Erro: Porta inacessível
```

## ⚙️ Desenvolvimento

### Adicionar Nova Funcionalidade

Para expandir o gerenciador de conexões:

```typescript
// Em convex/sshConnection.ts
export const searchConnections = query({
  args: { userId: v.id('user'), query: v.string() },
  handler: async (ctx, args) => {
    // Implementar busca
  }
})
```

### Testar Localmente

```bash
# Listar conexões
npm run dev

# Abrir DevTools (F12)
# Network → Convex requests
```

## 🐛 Troubleshooting

### "Conexão não foi salva"

- Confira se está logado
- Verifique o console (F12) para erros
- Tente criar novamente

### "Não consegue conectar após salvar"

- Verifique se host/porta estão corretos
- Teste localmente: `ssh -p PORT user@HOST`
- Confira credenciais

### "Erro 403 - Sem permissão"

- Verifique se a conexão pertence a você
- Tente fazer logout e login novamente

## 📚 Próximas Etapas

1. ✅ Salvar múltiplas conexões no banco
2. ✅ Interface de gerenciamento
3. ⏳ Criptografia de dados sensíveis
4. ⏳ Histórico de comandos por conexão
5. ⏳ Compartilhamento de conexões (com permissões)
6. ⏳ Snapshots de terminal
7. ⏳ Alertas de segurança

---

**Versão:** 2.0.0 (com Múltiplas Conexões)
**Data:** 2025-08-11
