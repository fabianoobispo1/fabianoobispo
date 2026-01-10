import { NextResponse } from 'next/server'
import { fetchMutation } from 'convex/nextjs'

import { api } from '@/convex/_generated/api'

export async function GET() {
  try {
    const result = await fetchMutation(api.seed.seedCategories, {})
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao executar seed:', error)
    return NextResponse.json(
      { error: 'Erro ao criar categorias' },
      { status: 500 },
    )
  }
}
