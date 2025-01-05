import { NextResponse } from 'next/server'

export async function GET() {
  const response = await fetch(
    'https://apiwhatsapp.fabianoobispo.com.br/session/status/jfimperadores',
    {
      headers: {
        accept: 'application/json',
        'x-api-key': 'fabianotoken',
      },
    },
  )

  const data = await response.json()
  return NextResponse.json(data)
}
