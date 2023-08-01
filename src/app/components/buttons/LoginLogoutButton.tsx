'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import type { ClientSafeProvider } from 'next-auth/react'
import styles from './header.module.css'
export default function LoginLogoutButton({
  auth,
}: {
  auth?: ClientSafeProvider
}) {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  return (
    <div className="flex items-center">
      {/* <p
        className={`nojs-show ${
          !session && loading ? styles.loading : styles.loaded
        }`}
      > */}
      {/*       <button
        type="button"
        className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={() => signIn(auth?.id || '')}
      >
        {auth ? `Sign In with ${auth.name}` : 'Login'}
      </button> */}
      {!session && (
        <a
          href={`/api/auth/signin`}
          className="relative z-10 float-right   cursor-pointer rounded border-blue-600 bg-blue-600 px-5 py-4 pb-3 pt-3 text-base font-medium leading-6 text-white no-underline hover:bg-blue-500"
          onClick={(e) => {
            e.preventDefault()
            signIn('github')
          }}
        >
          Entrar
        </a>
      )}
      {session?.user && (
        <a
          href={`/`}
          className="relative z-10 float-right -mr-2 cursor-pointer rounded border-blue-600 bg-blue-600 px-5 py-4 pb-3 pt-3 text-base font-medium leading-6 text-white no-underline hover:bg-blue-500"
          onClick={(e) => {
            e.preventDefault()
            signOut()
          }}
        >
          Sair
        </a>
      )}
      {/*  </p> */}
    </div>
  )
}
