import { mutation } from './_generated/server'

export const seedCategories = mutation({
  handler: async (ctx) => {
    // Verificar se já existem categorias
    const existingCategories = await ctx.db.query('categories').collect()

    if (existingCategories.length > 0) {
      console.log('Categorias já existem, pulando seed...')
      return { message: 'Categorias já existem' }
    }

    const now = Date.now()

    // Categorias de Despesas
    const expenseCategories = [
      {
        name: 'Alimentação',
        description: 'Supermercado, restaurantes, delivery',
      },
      {
        name: 'Transporte',
        description: 'Combustível, transporte público, apps',
      },
      { name: 'Moradia', description: 'Aluguel, condomínio, IPTU' },
      { name: 'Contas', description: 'Água, luz, internet, telefone' },
      { name: 'Saúde', description: 'Médico, farmácia, plano de saúde' },
      { name: 'Educação', description: 'Cursos, livros, material escolar' },
      { name: 'Lazer', description: 'Cinema, streaming, hobbies' },
      { name: 'Vestuário', description: 'Roupas, calçados, acessórios' },
      { name: 'Beleza', description: 'Salão, produtos de beleza' },
      { name: 'Outros', description: 'Despesas diversas' },
    ]

    // Categorias de Receitas
    const depositCategories = [
      { name: 'Salário', description: 'Salário mensal' },
      { name: 'Freelance', description: 'Trabalhos autônomos' },
      { name: 'Vendas', description: 'Vendas de produtos ou serviços' },
      { name: 'Presente', description: 'Presentes recebidos' },
      { name: 'Outras receitas', description: 'Receitas diversas' },
    ]

    // Categorias de Investimentos
    const investmentCategories = [
      { name: 'Ações', description: 'Investimento em ações' },
      { name: 'Fundos', description: 'Fundos de investimento' },
      { name: 'Poupança', description: 'Depósito em poupança' },
      { name: 'Previdência', description: 'Previdência privada' },
      { name: 'Outros investimentos', description: 'Investimentos diversos' },
    ]

    // Inserir categorias de despesas
    for (const category of expenseCategories) {
      await ctx.db.insert('categories', {
        name: category.name,
        type: 'EXPENSE',
        description: category.description,
        active: true,
        created_at: now,
        updated_at: now,
      })
    }

    // Inserir categorias de receitas
    for (const category of depositCategories) {
      await ctx.db.insert('categories', {
        name: category.name,
        type: 'DEPOSIT',
        description: category.description,
        active: true,
        created_at: now,
        updated_at: now,
      })
    }

    // Inserir categorias de investimentos
    for (const category of investmentCategories) {
      await ctx.db.insert('categories', {
        name: category.name,
        type: 'INVESTMENT',
        description: category.description,
        active: true,
        created_at: now,
        updated_at: now,
      })
    }

    return {
      message: 'Categorias criadas com sucesso!',
      total:
        expenseCategories.length +
        depositCategories.length +
        investmentCategories.length,
    }
  },
})
