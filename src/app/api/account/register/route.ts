import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { serviceMutation } from '@/lib/server/convex-auth'

import { api } from '../../../../../convex/_generated/api'

const bodySchema = z.object({
  nome: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
})

/**
 * POST /api/account/register — cadastro por e-mail/senha.
 * O hash é feito aqui (nunca no navegador) e o papel é sempre 'user'.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, password } = parsed.data
  const passwordHash = await hash(password, 12)
  const result = await serviceMutation(api.user.registerWithPasswordService, {
    nome,
    email,
    passwordHash,
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
