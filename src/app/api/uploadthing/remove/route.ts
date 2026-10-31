import { NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

import { auth } from '@/auth/auth'
import { serviceQuery } from '@/lib/server/convex-auth'

import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

const utapi = new UTApi()

/**
 * Remove um arquivo do Uploadthing. Só o dono (a imagem de perfil salva no
 * próprio usuário) ou um admin pode apagar — antes, qualquer usuário logado
 * apagava qualquer arquivo pela chave.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    imageKey?: unknown
  } | null
  const imageKey = typeof body?.imageKey === 'string' ? body.imageKey : ''
  if (!imageKey) return new NextResponse('Bad Request', { status: 400 })

  const user = await serviceQuery(api.user.getAuthByIdService, {
    userId: session.user.id as Id<'user'>,
  })
  const ownKey = user?.image_key?.substring(user.image_key.lastIndexOf('/') + 1)
  if (!user || (user.role !== 'admin' && ownKey !== imageKey)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const res = await utapi.deleteFiles(imageKey)
    return NextResponse.json(res)
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
