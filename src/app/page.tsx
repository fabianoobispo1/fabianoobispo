'use client'

import { useSession } from 'next-auth/react'

export default function Home() {
/*   const { data: session } = useSession() */
  /* if (Object.keys(session).length !== 0) {
    redirect('/protected')
  } */

  return (
  /*   <main className="flex min-h-screen flex-col items-center justify-around p-24">
      {session?.user && (
        <div>
          <p>{session.user.email}</p>
          <p>{session.user.name}</p>
        </div>
      )}
    </main>
   */

    <section className="bg-ct-blue-600 min-h-screen pt-32 px-4">
        <div className="max-w-4xl mx-auto bg-ct-dark-100 rounded-md h-[20rem] flex flex-col  justify-center items-center">
          <p className="text-3xl font-semibold">
            Em Breve ...
          </p>

          <div className="max-w-4xl mx-auto flex gap-2 p-4 justify-center max-sm:flex-col">
         {/*  <Link href={'/register'} className="w-60 ">
          <LoadingButton  textColor="text-ct-blue-600">
            Registrar
          </LoadingButton>
          </Link>
          <Link href={'/login'} className="w-60"  >
          <LoadingButton textColor="text-ct-blue-600">
            Entrar 
          </LoadingButton>
          </Link> */}
        </div>
        </div>      
      </section>
  )  
}

