import { NextResponse } from 'next/server'

export async function GET() {
  const response = await fetch(
    'https://apiwhatsapp.fabianoobispo.com.br/session/qr/jfimperadores/image',
    {
      headers: {
        accept: 'image/png',
        'x-api-key': 'fabianotoken',
      },
    },
  )

  const imageBuffer = await response.arrayBuffer()
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  })
}
