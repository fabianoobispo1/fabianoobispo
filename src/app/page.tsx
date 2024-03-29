'use client'

import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  /* if (Object.keys(session).length !== 0) {
    redirect('/protected')
  } */

  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24">
      {session?.user && (
        <div>
          <p>{session.user.email}</p>
          <p>{session.user.name}</p>
        </div>
      )}
    </main>
  )
}
