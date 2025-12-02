import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

// ==================== EXERCISE CATALOG ====================

// Criar exercício no catálogo
export const createCatalogExercise = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    muscleGroup: v.string(),
    equipment: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    defaultSets: v.optional(v.string()),
    defaultReps: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const catalogId = await ctx.db.insert('exerciseCatalog', {
      ...args,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return catalogId
  },
})

// Listar todos os exercícios do catálogo
export const getAllCatalogExercises = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('exerciseCatalog').collect()
  },
})

// Buscar exercícios por grupo muscular
export const getCatalogByMuscleGroup = query({
  args: { muscleGroup: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('exerciseCatalog')
      .withIndex('by_muscle_group', (q) =>
        q.eq('muscleGroup', args.muscleGroup),
      )
      .collect()
  },
})

// Buscar exercício do catálogo por ID
export const getCatalogExerciseById = query({
  args: { catalogId: v.id('exerciseCatalog') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.catalogId)
  },
})

// Atualizar exercício do catálogo
export const updateCatalogExercise = mutation({
  args: {
    catalogId: v.id('exerciseCatalog'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    muscleGroup: v.optional(v.string()),
    equipment: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    defaultSets: v.optional(v.string()),
    defaultReps: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { catalogId, ...updates } = args
    await ctx.db.patch(catalogId, {
      ...updates,
      updated_at: Date.now(),
    })
  },
})

// Deletar exercício do catálogo
export const deleteCatalogExercise = mutation({
  args: { catalogId: v.id('exerciseCatalog') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.catalogId)
  },
})

// Seed - Popular catálogo com exercícios padrão
export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const exercises = [
      // PEITO
      {
        name: 'Supino Reto (Barra)',
        description:
          'Exercício fundamental para peito. Foco na explosão na subida.',
        muscleGroup: 'peito',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-12',
        videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      },
      {
        name: 'Supino Inclinado (Halteres)',
        description: 'Trabalha a parte superior do peitoral.',
        muscleGroup: 'peito',
        equipment: 'halteres',
        defaultSets: '3',
        defaultReps: '10-12',
      },
      {
        name: 'Flexão de Braço',
        description: 'Exercício de peso corporal para peito e tríceps.',
        muscleGroup: 'peito',
        equipment: 'peso corporal',
        defaultSets: '3',
        defaultReps: '15-20',
      },

      // COSTAS
      {
        name: 'Barra Fixa',
        description: 'Exercício fundamental para costas e bíceps.',
        muscleGroup: 'costas',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-12',
      },
      {
        name: 'Remada Curvada',
        description: 'Trabalha toda a musculatura das costas.',
        muscleGroup: 'costas',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-10',
      },
      {
        name: 'Remada Unilateral',
        description: 'Foco em cada lado individualmente.',
        muscleGroup: 'costas',
        equipment: 'halteres',
        defaultSets: '3',
        defaultReps: '10-12',
      },

      // PERNAS
      {
        name: 'Agachamento Livre',
        description: 'Rei dos exercícios. Fundamental para pernas.',
        muscleGroup: 'pernas',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-12',
      },
      {
        name: 'Box Squat (Agachamento na Caixa)',
        description: 'Protege o joelho e simula a base do pass block.',
        muscleGroup: 'pernas',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-10',
      },
      {
        name: 'Leg Press 45°',
        description: 'Alternativa ao agachamento, menos carga na coluna.',
        muscleGroup: 'pernas',
        equipment: 'máquina',
        defaultSets: '4',
        defaultReps: '12-15',
      },
      {
        name: 'Stiff (Levantamento Romeno)',
        description: 'Trabalha posterior de coxa e glúteos.',
        muscleGroup: 'pernas',
        equipment: 'barra',
        defaultSets: '3',
        defaultReps: '10-12',
      },

      // OMBROS
      {
        name: 'Desenvolvimento Militar',
        description: 'Fortalecer ombros para sustentar bloqueios.',
        muscleGroup: 'ombros',
        equipment: 'barra',
        defaultSets: '4',
        defaultReps: '8-12',
      },
      {
        name: 'Elevação Lateral',
        description: 'Isolamento do deltóide lateral.',
        muscleGroup: 'ombros',
        equipment: 'halteres',
        defaultSets: '3',
        defaultReps: '12-15',
      },
      {
        name: 'Desenvolvimento Arnold',
        description: 'Trabalha todos os feixes do deltóide.',
        muscleGroup: 'ombros',
        equipment: 'halteres',
        defaultSets: '3',
        defaultReps: '10-12',
      },

      // BRAÇOS
      {
        name: 'Rosca Direta (Barra)',
        description: 'Exercício clássico para bíceps.',
        muscleGroup: 'braços',
        equipment: 'barra',
        defaultSets: '3',
        defaultReps: '10-12',
      },
      {
        name: 'Tríceps Testa',
        description: 'Isolamento de tríceps.',
        muscleGroup: 'braços',
        equipment: 'barra',
        defaultSets: '3',
        defaultReps: '10-12',
      },
      {
        name: 'Rosca Martelo',
        description: 'Trabalha bíceps e antebraço.',
        muscleGroup: 'braços',
        equipment: 'halteres',
        defaultSets: '3',
        defaultReps: '12-15',
      },

      // CORE/ABDÔMEN
      {
        name: 'Prancha Abdominal',
        description: 'Essencial para estabilidade e prevenção de lesões.',
        muscleGroup: 'core',
        equipment: 'peso corporal',
        defaultSets: '3',
        defaultReps: '30-60s',
      },
      {
        name: 'Abdominal Infra (Elevação de Pernas)',
        description: 'Foco na parte inferior do abdômen.',
        muscleGroup: 'core',
        equipment: 'peso corporal',
        defaultSets: '3',
        defaultReps: '15-20',
      },
      {
        name: 'Russian Twist',
        description: 'Trabalha oblíquos e rotação do tronco.',
        muscleGroup: 'core',
        equipment: 'peso corporal',
        defaultSets: '3',
        defaultReps: '20-30',
      },

      // MOBILIDADE
      {
        name: 'Mobilidade de Ombro e Quadril',
        description: 'Essencial antes de começar o treino.',
        muscleGroup: 'mobilidade',
        equipment: 'peso corporal',
        defaultSets: '1',
        defaultReps: '5-10 min',
      },
    ]

    for (const exercise of exercises) {
      await ctx.db.insert('exerciseCatalog', {
        ...exercise,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    }

    return { count: exercises.length }
  },
})
