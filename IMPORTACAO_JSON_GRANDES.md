# Guia: Importação de Arquivos JSON Grandes

## ✅ Melhorias Implementadas

### Frontend ([contatos/page.tsx](<src/app/(dashboard)/dashboard/whatsapp/contatos/page.tsx>))

- **Processamento em lotes**: Divide o JSON em chunks de 1000 contatos
- **Barra de progresso**: Exibe progresso visual da importação
- **Delay entre lotes**: Evita sobrecarga do servidor (100ms entre chunks)
- **Contador formatado**: Mostra total de contatos com separador de milhares

### Backend ([convex/contacts.ts](convex/contacts.ts))

- **Queries otimizadas**: Busca apenas contatos relevantes ao lote atual
- **Processamento paralelo**: Usa `Promise.all` para operações em sub-batches de 50
- **Mapa de busca**: Cache em memória para verificação rápida de duplicatas

## 📊 Performance Esperada

| Tamanho do Arquivo | Tempo Estimado | Memória |
| ------------------ | -------------- | ------- |
| 10k contatos       | ~30 segundos   | ~50 MB  |
| 100k contatos      | ~5 minutos     | ~200 MB |
| 500k contatos      | ~25 minutos    | ~1 GB   |

## 🚀 Otimizações Adicionais (Se Ainda Estiver Lento)

### 1. Processamento em Background com Worker

Se ainda tiver problemas, considere usar Web Workers:

```tsx
// Criar worker para processar JSON em background
const worker = new Worker('/workers/json-processor.js')
worker.postMessage({ file, chunkSize: 1000 })
```

### 2. Streaming de Arquivo

Para arquivos extremamente grandes (>100MB):

```tsx
const handleFileStream = async (file: File) => {
  const stream = file.stream()
  const reader = stream.getReader()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += new TextDecoder().decode(value)
    // Processar buffer linha por linha
  }
}
```

### 3. API Route Alternativa

Se o Convex estiver limitado, crie uma API route:

```typescript
// src/app/api/import-contacts/route.ts
export async function POST(req: Request) {
  const { contacts, userId } = await req.json()

  // Processar em background
  // Retornar job ID para polling
  return Response.json({ jobId: '...' })
}
```

### 4. Upload via UploadThing + Background Job

Para arquivos muito grandes:

1. Upload para UploadThing/S3
2. Processar arquivo no servidor via cron
3. Notificar usuário quando completo

```typescript
// convex/contacts.ts
export const processUploadedFile = mutation({
  args: { fileUrl: v.string(), userId: v.id('user') },
  handler: async (ctx, args) => {
    // Baixar arquivo
    // Processar em chunks
    // Atualizar progresso no DB
  },
})
```

## 💡 Dicas de Preparação do JSON

### Otimize o arquivo JSON antes de importar:

```bash
# Remover campos desnecessários
jq '[.contacts[] | {number, name, lastMessageAt, lastMessageText}]' input.json > optimized.json

# Dividir arquivo em múltiplos menores
split -l 100000 contacts.json chunk_

# Comprimir para reduzir tamanho
gzip contacts.json
```

### Estrutura Ideal do JSON:

```json
{
  "contacts": [
    {
      "number": "5511999999999",
      "name": "João Silva",
      "lastMessageAt": "2026-01-13T10:00:00Z",
      "lastMessageText": "Olá!"
    }
  ]
}
```

## 🔧 Monitoramento

Acompanhe a importação pelo console do navegador:

- Network tab: Verifique tempo de resposta das mutations
- Performance tab: Monitore uso de memória
- Console: Logs de progresso

## ⚠️ Limites do Convex

- **Timeout de função**: ~10 minutos por mutation
- **Tamanho de payload**: ~10 MB por request
- **Rate limiting**: ~1000 requests/minuto

Se ultrapassar estes limites, considere as otimizações da seção anterior.

## 📞 Suporte

Se continuar com problemas:

1. Verifique logs do Convex Dashboard
2. Reduza `CHUNK_SIZE` para 500 ou menos
3. Aumente delay entre chunks para 500ms
4. Considere processar em horários de menor uso
