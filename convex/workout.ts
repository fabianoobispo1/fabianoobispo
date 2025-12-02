import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

// ==================== WORKOUT PLAN ====================

export const createPlan = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.db.insert('workoutPlan', {
      name: args.name,
      description: args.description,
      active: true,
      userId: args.userId,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return planId
  },
})

export const getPlansByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('workoutPlan')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
  },
})

export const getPlanById = query({
  args: { planId: v.id('workoutPlan') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId)
  },
})

export const updatePlan = mutation({
  args: {
    planId: v.id('workoutPlan'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args
    await ctx.db.patch(planId, {
      ...updates,
      updated_at: Date.now(),
    })
  },
})

export const deletePlan = mutation({
  args: { planId: v.id('workoutPlan') },
  handler: async (ctx, args) => {
    // Deletar todos os dias do plano
    const days = await ctx.db
      .query('workoutDay')
      .withIndex('by_plan', (q) => q.eq('planId', args.planId))
      .collect()

    for (const day of days) {
      // Deletar todos os exercícios do dia
      const exercises = await ctx.db
        .query('exercise')
        .withIndex('by_day', (q) => q.eq('dayId', day._id))
        .collect()

      for (const exercise of exercises) {
        await ctx.db.delete(exercise._id)
      }

      await ctx.db.delete(day._id)
    }

    // Deletar o plano
    await ctx.db.delete(args.planId)
  },
})

// ==================== WORKOUT DAY ====================

export const createDay = mutation({
  args: {
    planId: v.id('workoutPlan'),
    title: v.string(),
    focus: v.string(),
    dayOfWeek: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const dayId = await ctx.db.insert('workoutDay', {
      ...args,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return dayId
  },
})

export const getDaysByPlan = query({
  args: { planId: v.id('workoutPlan') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('workoutDay')
      .withIndex('by_plan', (q) => q.eq('planId', args.planId))
      .collect()
  },
})

export const updateDay = mutation({
  args: {
    dayId: v.id('workoutDay'),
    title: v.optional(v.string()),
    focus: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { dayId, ...updates } = args
    await ctx.db.patch(dayId, {
      ...updates,
      updated_at: Date.now(),
    })
  },
})

export const deleteDay = mutation({
  args: { dayId: v.id('workoutDay') },
  handler: async (ctx, args) => {
    // Deletar todos os exercícios do dia
    const exercises = await ctx.db
      .query('exercise')
      .withIndex('by_day', (q) => q.eq('dayId', args.dayId))
      .collect()

    for (const exercise of exercises) {
      await ctx.db.delete(exercise._id)
    }

    await ctx.db.delete(args.dayId)
  },
})

// ==================== EXERCISE ====================

// Criar exercício a partir do catálogo
export const createExerciseFromCatalog = mutation({
  args: {
    dayId: v.id('workoutDay'),
    catalogId: v.id('exerciseCatalog'),
    order: v.number(),
    carga: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar dados do catálogo
    const catalog = await ctx.db.get(args.catalogId)
    if (!catalog) throw new Error('Exercício não encontrado no catálogo')

    const exerciseId = await ctx.db.insert('exercise', {
      dayId: args.dayId,
      catalogId: args.catalogId,
      name: catalog.name,
      sets: catalog.defaultSets || '3',
      reps: catalog.defaultReps || '10',
      note: catalog.description,
      videoUrl: catalog.videoUrl,
      carga: args.carga,
      order: args.order,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return exerciseId
  },
})

// Criar exercício customizado (sem catálogo)
export const createExercise = mutation({
  args: {
    dayId: v.id('workoutDay'),
    name: v.string(),
    sets: v.string(),
    reps: v.string(),
    note: v.string(),
    order: v.number(),
    carga: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const exerciseId = await ctx.db.insert('exercise', {
      ...args,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return exerciseId
  },
})

export const getExercisesByDay = query({
  args: { dayId: v.id('workoutDay') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('exercise')
      .withIndex('by_day', (q) => q.eq('dayId', args.dayId))
      .collect()
  },
})

export const updateExercise = mutation({
  args: {
    exerciseId: v.id('exercise'),
    name: v.optional(v.string()),
    sets: v.optional(v.string()),
    reps: v.optional(v.string()),
    note: v.optional(v.string()),
    carga: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { exerciseId, ...updates } = args
    await ctx.db.patch(exerciseId, {
      ...updates,
      updated_at: Date.now(),
    })
  },
})

export const updateExerciseCarga = mutation({
  args: {
    exerciseId: v.id('exercise'),
    carga: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.exerciseId, {
      carga: args.carga,
      updated_at: Date.now(),
    })
  },
})

export const deleteExercise = mutation({
  args: { exerciseId: v.id('exercise') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.exerciseId)
  },
})

// ==================== QUERY COMPLETA ====================

export const getFullWorkoutPlan = query({
  args: { planId: v.id('workoutPlan') },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) return null

    const days = await ctx.db
      .query('workoutDay')
      .withIndex('by_plan', (q) => q.eq('planId', args.planId))
      .collect()

    const daysWithExercises = await Promise.all(
      days.map(async (day) => {
        const exercises = await ctx.db
          .query('exercise')
          .withIndex('by_day', (q) => q.eq('dayId', day._id))
          .collect()

        return {
          ...day,
          exercises: exercises.sort((a, b) => a.order - b.order),
        }
      }),
    )

    return {
      ...plan,
      days: daysWithExercises.sort((a, b) => a.order - b.order),
    }
  },
})

// ==================== SEED DATA ====================

export const seedDefaultPlan = mutation({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    // Criar plano padrão
    const planId = await ctx.db.insert('workoutPlan', {
      name: 'Left Tackle Protocol',
      description: 'Ficha de retorno: Força, Estabilidade e Proteção Articular',
      active: true,
      userId: args.userId,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    // Segunda-feira
    const seg = await ctx.db.insert('workoutDay', {
      planId,
      title: 'Segunda-Feira',
      focus: 'Força de Empurrar & Base (O Punch)',
      dayOfWeek: 'seg',
      order: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const segExercises = [
      {
        name: 'Mobilidade de Ombro e Quadril',
        sets: '1',
        reps: '5-10 min',
        note: 'Essencial antes de começar.',
        videoUrl: 'https://www.youtube.com/watch?v=example1',
      },
      {
        name: 'Box Squat (Agachamento na Caixa)',
        sets: '4',
        reps: '8-10',
        note: 'Protege o joelho e simula a base do pass block.',
        videoUrl: 'https://www.youtube.com/watch?v=example2',
      },
      {
        name: 'Supino Reto (Halteres ou Barra)',
        sets: '4',
        reps: '8-12',
        note: 'Foco na explosão na subida.',
      },
      {
        name: 'Desenvolvimento Militar (Sentado)',
        sets: '3',
        reps: '10-12',
        note: 'Fortalecer ombros para sustentar bloqueios.',
      },
      {
        name: 'Prancha Abdominal',
        sets: '3',
        reps: '30-45 seg',
        note: 'Segure firme. O core protege sua coluna.',
      },
      {
        name: 'Cardio: Bike ou Elíptico',
        sets: '1',
        reps: '15 min',
        note: 'Ritmo moderado.',
      },
    ]

    for (let i = 0; i < segExercises.length; i++) {
      await ctx.db.insert('exercise', {
        dayId: seg,
        ...segExercises[i],
        order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    }

    // Quarta-feira
    const qua = await ctx.db.insert('workoutDay', {
      planId,
      title: 'Quarta-Feira',
      focus: 'Cadeia Posterior & Puxar (Tração)',
      dayOfWeek: 'qua',
      order: 2,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const quaExercises = [
      {
        name: 'Mobilidade Torácica',
        sets: '1',
        reps: '5 min',
        note: 'Gato-vaca e rotações.',
      },
      {
        name: 'Levantamento Terra (Trap Bar/Hex Bar)',
        sets: '4',
        reps: '6-8',
        note: 'Use a barra hexagonal se tiver, é mais seguro para as costas.',
      },
      {
        name: 'Remada Curvada ou Máquina',
        sets: '4',
        reps: '10-12',
        note: 'Costas fortes = estabilidade no bloqueio.',
      },
      {
        name: 'Face Pulls',
        sets: '3',
        reps: '15',
        note: 'Saúde do manguito rotador.',
      },
      {
        name: 'Farmer Walk (Caminhada do Fazendeiro)',
        sets: '3',
        reps: '30 metros',
        note: 'Pegada e estabilidade do core em movimento.',
      },
      {
        name: 'Cardio: Remo (Ergômetro)',
        sets: '1',
        reps: '10-15 min',
        note: 'Excelente para condicionamento total.',
      },
    ]

    for (let i = 0; i < quaExercises.length; i++) {
      await ctx.db.insert('exercise', {
        dayId: qua,
        ...quaExercises[i],
        order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    }

    // Sexta-feira
    const sex = await ctx.db.insert('workoutDay', {
      planId,
      title: 'Sexta-Feira',
      focus: 'Condicionamento Específico de Lineman',
      dayOfWeek: 'sex',
      order: 3,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const sexExercises = [
      {
        name: 'Aquecimento Dinâmico',
        sets: '1',
        reps: '5 min',
        note: 'Passadas, rotações.',
      },
      {
        name: 'Sled Push (Empurrar o Trenó)',
        sets: '5',
        reps: '15-20 metros',
        note: 'O exercício nº 1 para Lineman. Coloque carga moderada.',
      },
      {
        name: 'Step-up na Caixa',
        sets: '3',
        reps: '10 (cada perna)',
        note: 'Força unilateral. Use uma caixa baixa/média.',
      },
      {
        name: 'Medicine Ball Slams',
        sets: '4',
        reps: '10-12',
        note: 'Explosão pura sem impacto articular.',
      },
      {
        name: 'Pallof Press',
        sets: '3',
        reps: '12 (cada lado)',
        note: 'Anti-rotação. Vital para não ser girado pelo Defensive End.',
      },
      {
        name: 'Alongamento Completo',
        sets: '1',
        reps: '10 min',
        note: 'Foco em flexores de quadril e peitoral.',
      },
    ]

    for (let i = 0; i < sexExercises.length; i++) {
      await ctx.db.insert('exercise', {
        dayId: sex,
        ...sexExercises[i],
        order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    }

    return planId
  },
})
