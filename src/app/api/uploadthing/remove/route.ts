import { NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

import { auth } from '@/auth/auth'

const utapi = new UTApi()

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { imageKey } = await request.json()
  try {
    const res = await utapi.deleteFiles(imageKey)
    return NextResponse.json(res)
  } catch (error) {
    console.log(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
