# Setup da Ficha de Treino

## Arquivos Criados

### 1. Schema Convex (`convex/schema.ts`)

Adicionados 3 novos schemas:

- `workoutPlanSchema`: Planos de treino do usuário
- `workoutDaySchema`: Dias da semana do plano (Segunda, Quarta, Sexta)
- `exerciseSchema`: Exercícios de cada dia

### 2. Funções Backend (`convex/workout.ts`)

Criadas funções para:

- **Planos**: `createPlan`, `getPlansByUser`, `getPlanById`, `updatePlan`, `deletePlan`
- **Dias**: `createDay`, `getDaysByPlan`, `updateDay`, `deleteDay`
- **Exercícios**: `createExercise`, `getExercisesByDay`, `updateExercise`, `deleteExercise`
- **Completo**: `getFullWorkoutPlan` (busca plano com dias e exercícios)
- **Seed**: `seedDefaultPlan` (cria plano padrão "Left Tackle Protocol")

### 3. Página Frontend (`src/app/(dashboard)/dashboard/fichaexercicios/page.tsx`)

Componente completo com:

- Integração com Convex (queries e mutations)
- Design system do projeto (usa cores do tema: `bg-card`, `text-primary`, `text-muted-foreground`)
- ScrollArea para scroll adequado
- Breadcrumb navigation
- Seleção de dias da semana
- Visualização de exercícios com séries, reps e notas
- Auto-criação do plano padrão no primeiro acesso
- Responsivo e com suporte a dark/light mode automático

## Como Executar

### 1. Sincronizar o Convex

**IMPORTANTE**: Execute este comando em um terminal separado:

```bash
npx convex dev
```

Isso irá:

- Detectar as mudanças no schema
- Gerar os tipos TypeScript atualizados
- Sincronizar as novas tabelas e funções

### 2. Executar o Next.js

Em outro terminal:

```bash
npm run dev
```

### 3. Acessar a Ficha

Navegue para: `http://localhost:3000/dashboard/fichaexercicios`

## Funcionalidades

### Primeira Vez

- Ao acessar pela primeira vez, o sistema cria automaticamente o plano "Left Tackle Protocol" com 3 dias:
  - Segunda-feira: Força de Empurrar & Base
  - Quarta-feira: Cadeia Posterior & Puxar
  - Sexta-feira: Condicionamento Específico

### Interface

- **Header**: Nome do plano e descrição
- **Seleção de Dias**: Botões para alternar entre os dias
- **Cards de Exercícios**:
  - Nome do exercício
  - Nota/instrução
  - Séries e repetições em destaque

### Dados Armazenados

Todos os dados são salvos no Convex e associados ao usuário logado (`userId`).

## Próximos Passos (Futuras Melhorias)

1. **Adicionar edição de exercícios**: Permitir que o usuário customize os exercícios
2. **Múltiplos planos**: Criar e alternar entre diferentes planos de treino
3. **Progresso**: Registrar e acompanhar o progresso dos treinos
4. **Exportar PDF**: Gerar PDF da ficha completa
5. **Compartilhar**: Compartilhar planos com outros usuários

## Troubleshooting

### Erro: "A propriedade 'workout' não existe"

**Solução**: Certifique-se de que `npx convex dev` está rodando. Ele gera os tipos automaticamente.

### Plano não aparece

**Solução**: Verifique se você está logado e se o Convex está sincronizado.

### Erro ao criar plano

**Solução**: Verifique o console do navegador e os logs do `npx convex dev` para detalhes.

## Estrutura de Dados

```typescript
workoutPlan
├── _id
├── name
├── description
├── userId
└── days []
    ├── _id
    ├── title
    ├── focus
    ├── dayOfWeek
    └── exercises []
        ├── name
        ├── sets
        ├── reps
        └── note
```
