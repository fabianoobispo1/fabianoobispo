# 🚀 Guia Rápido - Suite WhatsApp Business

## ⚡ Começar em 5 minutos

### 1. Acesse as ferramentas

```
http://localhost:3000/ferramentas
```

### 2. Fluxo Recomendado

```
┌─────────────────────────────────────────────────┐
│  STEP 1: Criar Template                         │
│  → Ir para "Gerenciar Templates"               │
│  → Clicar "Novo Template"                      │
│  → Preencher informações                       │
│  → Adicionar variáveis dinâmicas               │
│  → Salvar                                       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 2: Criar Campanha                        │
│  → Ir para "Gerador de Variáveis"             │
│  → Selecionar template criado                 │
│  → Preencher valores das variáveis             │
│  → Adicionar destinatários                     │
│  → Criar campanha                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 3: Disparar                               │
│  → Ir para "Disparador de Campanhas"           │
│  → Selecionar campanha criada                 │
│  → Confirmar disparos                          │
│  → Escolher "Agora" ou "Agendar"              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 4: Acompanhar                             │
│  → Ir para "Monitor de Campanhas"              │
│  → Visualizar métricas em tempo real           │
│  → Clicar em campanha para detalhes            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  STEP 5: Rastrear                               │
│  → Ir para "Rastreador de Entregas"            │
│  → Selecionar campanha                         │
│  → Filtrar por status                          │
│  → Clicar em mensagem para detalhes            │
└─────────────────────────────────────────────────┘
```

---

## 📝 Exemplo Prático

### Cenário: Notificar clientes sobre novo produto

#### Template:

```
Nome: Novo Produto Disponível
Categoria: MARKETING

Conteúdo:
Olá {{1}},

Temos o prazer de apresentar nosso novo produto:
{{2}}

Aproveite {{3}} de desconto usando o código:
{{4}}

Clique aqui para conferir: {{5}}

Atenciosamente,
Equipe [Empresa]
```

Variáveis:

- {{1}}: Nome do cliente (texto, obrigatório)
- {{2}}: Nome do produto (texto, obrigatório)
- {{3}}: Porcentagem de desconto (número, obrigatório)
- {{4}}: Código promocional (texto, obrigatório)
- {{5}}: URL do produto (URL, obrigatório)

#### Campanha:

```
Cliente 1:
+55 11 99999-9999 | João Silva | Teclado Mecânico | 15% | PROMO15 | https://...

Cliente 2:
+55 21 99999-9999 | Maria Santos | Mouse Gamer | 20% | PROMO20 | https://...

Cliente 3:
+55 85 99999-9999 | Pedro Costa | Monitor 144Hz | 10% | PROMO10 | https://...
```

#### Resultado:

Cada cliente recebe uma mensagem personalizada!

---

## 🎯 Dicas por Ferramenta

### 📝 Gerenciar Templates

**✅ Boas Práticas**:

- Use linguagem clara e profissional
- Limite a 5-10 variáveis por template
- Teste com dados reais antes de usar
- Categorize corretamente (marketing vs transacional)
- Mantenha templates atualizados

**❌ Erros Comuns**:

- Usar muitas variáveis
- Conteúdo muito longo (máximo 1024 caracteres)
- Variáveis obrigatórias não preenchidas
- Usar caracteres especiais não suportados

---

### ⚡ Gerador de Variáveis

**✅ Boas Práticas**:

- Adicione um destinatário por vez
- Verifique o preview antes de criar
- Use nomes de campanha descritivos
- Valide números de telefone

**❌ Erros Comuns**:

- Números de telefone inválidos
- Variáveis obrigatórias vazias
- Criação com 0 destinatários

---

### 🚀 Disparador de Campanhas

**✅ Boas Práticas**:

- Sempre confirme antes de disparar
- Verifique quantidade de destinatários
- Respeite horários comerciais
- Faça backup antes de campanhas importantes

**❌ Erros Comuns**:

- Disparar sem verificar conteúdo
- Campanhas sem consentimento
- Disparar para contatos incorretos

---

### 📊 Monitor de Campanhas

**✅ Boas Práticas**:

- Acompanhe regularmente
- Analise taxa de entrega
- Identifique problemas cedo
- Documente métricas

**❌ Erros Comuns**:

- Ignorar campanhas pausadas
- Não investigar altas taxas de falha
- Deixar campanhas perdidas no histórico

---

### 👁️ Rastreador de Entregas

**✅ Boas Práticas**:

- Revise mensagens com falha
- Identifique padrões de erro
- Atualize status quando possível
- Use para investigar reclamações

**❌ Erros Comuns**:

- Não reagir a falhas
- Desistir muito rápido
- Não validar números de telefone

---

## 🔢 Números e Estatísticas Esperadas

### Taxa de Entrega

- Enviadas com sucesso: 95%+ (com números válidos)
- Entregues: 90%+ (dentro de 24h)
- Lidas: 40-60% (dependendo do público)
- Taxa de falha: < 5% (números inválidos)

### Tempo de Processamento

- Template criado: Instantâneo
- Campanha criada: Instantâneo
- Disparo iniciado: Instantâneo
- Entrega completa: 5-30 minutos (dependendo da quantidade)

---

## 🔐 Checklist de Segurança

Antes de disparar qualquer campanha:

- [ ] Template validado (sem erros)
- [ ] Todos os destinatários têm números válidos
- [ ] Consentimento obtido (evidência guardada)
- [ ] Conteúdo revisto (sem spam ou conteúdo inapropriado)
- [ ] Variáveis preenchidas corretamente
- [ ] Horário apropriado (não madrugada)
- [ ] Frequência apropriada (não spam)
- [ ] Backup da campanha feito
- [ ] Conformidade LGPD verificada
- [ ] Confirmação dupla completada

---

## 📱 Formatos de Número Aceitos

✅ **Válidos**:

```
+55 11 99999-9999
+5511999999999
+55 (11) 99999-9999
55 11 9 9999-9999
```

❌ **Inválidos**:

```
11 99999-9999 (sem código de país)
+55 11 9999-999 (poucos dígitos)
+55 11 999999999999 (muitos dígitos)
```

---

## 📊 Tipos de Campanha

### 1. Marketing

- Promoções
- Novos produtos
- Ofertas especiais
- Newsletter

### 2. Transacional

- Confirmação de pedido
- Confirmação de pagamento
- Envio/entrega
- Recibos

### 3. OTP (One-Time Password)

- Código de verificação
- Código de reset de senha
- Autenticação 2FA

### 4. Notificação

- Lembretes
- Alertas
- Status updates

---

## 🆘 Troubleshooting

### Problema: Campanha não aparece

**Solução**: Certifique-se de que:

- Está logado com a conta correta
- Template foi criado com sucesso
- Campanha foi criada (não apenas visualizada)

### Problema: Mensagens não entregando

**Solução**: Verifique:

- Números de telefone com código de país (+55)
- Conteúdo não é spam
- API da Meta está conectada (quando implementada)

### Problema: Variáveis não são preenchidas

**Solução**: Certifique-se:

- Template tem variáveis
- Você preencheu todos os campos obrigatórios
- Nomes estão corretos

### Problema: Não consigo disparar

**Solução**: Verifique:

- Campanha está em rascunho (status draft)
- Tem pelo menos 1 destinatário
- Confirmou com dupla verificação

---

## 💡 Tips e Tricks

### Reutilizar Templates

1. Crie um template
2. Use em múltiplas campanhas
3. Atualize quando necessário
4. Versione em rascunhos

### Testar Antes de Disparar

1. Crie campanha de teste
2. Adicione seu próprio número
3. Visualize no preview
4. Dispare para si mesmo
5. Valide na prática

### Organizar Campanhas

- Use nomes descritivos
- Inclua data no nome quando apropriado
- Documente o propósito
- Archive quando terminar

### Analisar Resultados

- Compare taxas entre campanhas
- Identifique melhor horário
- Teste diferentes conteúdos
- Documente aprendizados

---

## 📞 Contatos Rápidos

Para dúvidas técnicas:

1. Consulte `WHATSAPP_BUSINESS_TOOLS.md`
2. Revise o código em `convex/whatsAppCampaign.ts`
3. Analise o schema em `convex/schema.ts`

---

## 🎓 Próximos Passos

Depois de dominar as ferramentas:

1. **Integrar Meta API** - Conecte com Meta for real
2. **Importar Contatos** - Faça upload em lote
3. **Automatizar** - Crie fluxos automáticos
4. **Analisar** - Use dados para otimizar
5. **Escalar** - Gerencie milhões de mensagens

---

**Versão**: 1.0
**Data**: 12 de Janeiro de 2026
**Status**: ✅ Pronto para Uso

---

**Boa sorte com suas campanhas! 🚀**
