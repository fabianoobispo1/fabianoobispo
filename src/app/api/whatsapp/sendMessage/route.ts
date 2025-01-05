import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  const response = await fetch(
    'https://apiwhatsapp.fabianoobispo.com.br/client/sendMessage/jfimperadores',
    {
      method: 'POST',
      headers: {
        accept: '*/*',
        'x-api-key': 'fabianotoken',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  const data = await response.json()
  return NextResponse.json(data)
}
