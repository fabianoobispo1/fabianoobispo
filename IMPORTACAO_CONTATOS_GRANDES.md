# Guia de Importação de Contatos em Grande Volume

## Problema Resolvido

Quando você tenta importar arquivos JSON com **muitos contatos** (mais de 32.000), o Convex retorna o erro:

```
Error: Too many documents read in a single function execution (limit: 32000)
```

## Soluções Implementadas

### 1. **Paginação na Busca de Contatos Existentes** (`importFromJson`)

**Como funciona:**

- Em vez de carregar todos os contatos com `.collect()`, usa `.paginate()` com páginas de 1000 registros
- Constrói um mapa de contatos existentes aos poucos
- Processa cada novo contato verificando no mapa

**Quando usar:**

- Ideal para importações **médias** (até 50k contatos no banco + 10k novos)
- Melhor performance quando há muitos contatos existentes
- Usa menos operações de leitura individuais

**Exemplo:**

```typescript
const importContacts = useMutation(api.contacts.importFromJson)
await importContacts({ userId, contacts: batchOf100 })
```

### 2. **Busca Individual por Contato** (`importFromJsonOptimized`)

**Como funciona:**

- Para cada contato novo, faz uma busca individual usando índice composto `by_user_number`
- Não carrega todos os contatos existentes na memória
- Cada operação lê apenas 1 documento (ou nenhum se não existir)

**Quando usar:**

- Ideal para **volumes muito grandes** (100k+ contatos no banco)
- Melhor quando a maioria dos contatos é nova (inserção)
- Evita limite de 32k completamente

**Exemplo:**

```typescript
const importContactsOptimized = useMutation(
  api.contacts.importFromJsonOptimized,
)
await importContactsOptimized({ userId, contacts: batchOf50 })
```

## Estratégia de Processamento no Frontend

O frontend já implementa processamento em lotes:

```typescript
const CHUNK_SIZE = 100 // Processa 100 contatos por vez

for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
  const chunk = contacts.slice(i, i + CHUNK_SIZE)

  const res = await importContacts({
    userId: session.user.id as Id<'user'>,
    contacts: chunk,
  })

  // Delay de 200ms entre lotes
  if (i + CHUNK_SIZE < contacts.length) {
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}
```

## Recomendações

### Para Importações Normais (< 50k contatos totais)

- Use `api.contacts.importFromJson`
- Tamanho do lote: **100 contatos**
- Delay entre lotes: **200ms**

### Para Volumes Gigantes (> 100k contatos)

- Use `api.contacts.importFromJsonOptimized`
- Tamanho do lote: **50 contatos** (busca individual é mais lenta)
- Delay entre lotes: **300ms**

### Para Banco de Dados Limpo (primeira importação)

- Use `api.contacts.importFromJsonOptimized`
- Como não há contatos existentes, cada operação será uma inserção rápida
- Tamanho do lote: **200 contatos**

## Índices Necessários no Schema

Certifique-se de que o schema tem os índices corretos:

```typescript
contacts: defineTable(contactsSchema)
  .index('by_user', ['userId']) // Para paginação
  .index('by_user_number', ['userId', 'number']) // Para busca individual
```

## Função Adicional: Limpar Contatos

Para resetar a base de contatos antes de reimportar:

```typescript
const deleteContacts = useMutation(api.contacts.deleteByUser)
await deleteContacts({ userId: session.user.id })
```

## Monitoramento

Acompanhe o progresso no console do Convex (`npx convex dev`):

```
Starting import of 100 contacts for user xyz
Found 45230 existing contacts (paginated)
Import complete: 42 inserted, 58 updated, 0 skipped
```

## Troubleshooting

### "Function execution too long"

- Reduza o tamanho do lote (de 100 para 50)
- Aumente o delay entre lotes (de 200ms para 500ms)

### "Rate limit exceeded"

- Aumente o delay entre lotes para 1000ms
- Processe em horários de menor carga

### Importação lenta

- Verifique se os índices estão configurados corretamente
- Para primeira importação, use `importFromJsonOptimized` com lotes maiores (200)
- Para atualizações, use `importFromJson` padrão
