import { NextResponse } from 'next/server'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'

import { auth } from '@/auth/auth'
import { serviceMutation, serviceQuery } from '@/lib/server/convex-auth'

import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

const bodySchema = z.object({
  oldPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(128),
})

/**
 * POST /api/account/password — troca a senha do usuário logado.
 * Exige a senha atual; a comparação e o hash acontecem só no servidor.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const userId = session.user.id as Id<'user'>
  const user = await serviceQuery(api.user.getAuthByIdService, { userId })
  if (!user || !user.password) {
    return NextResponse.json(
      { error: 'Conta sem senha (login via Google/GitHub)' },
      { status: 400 },
    )
  }

  if (!(await compare(parsed.data.oldPassword, user.password))) {
    return NextResponse.json(
      { error: 'Senha antiga incorreta.' },
      { status: 403 },
    )
  }

  await serviceMutation(api.user.setPasswordHashService, {
    userId,
    passwordHash: await hash(parsed.data.newPassword, 12),
  })
  return NextResponse.json({ ok: true })
}
