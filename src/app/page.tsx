/* import { LoadingButton } from '@/components/LoadingButton';
import { useSession } from 'next-auth/react'
import Link from "next/link";
 */

import ModalLogin from "./components/ModalLogin";

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
    <main className="flex min-h-screen flex-col items-start justify-start p-6">
      <h1>início</h1>
      <ModalLogin />
    </main>

    /*     <section className="bg-ct-blue-600 min-h-screen px-4 pt-32">
      <div className="bg-ct-dark-100 mx-auto flex h-[20rem] max-w-4xl flex-col items-center  justify-center rounded-md">
        <p className="text-3xl font-semibold">Em Breve ...</p>

        <div className="mx-auto flex max-w-4xl justify-center gap-2 p-4 max-sm:flex-col"> */
    /*  <Link href={'/register'} className="w-60 ">
          <LoadingButton  textColor="text-ct-blue-600">
            Registrar
          </LoadingButton>
          </Link>*/
    /* <Link href={'/login'} className="w-60"  >
          <LoadingButton textColor="text-ct-blue-600">
            Entrar 
          </LoadingButton>
          </Link>  */
    /*   </div>
      </div>
    </section> */
  );
}
