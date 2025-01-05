import { Metadata } from 'next'

import AuthenticationModal from '@/components/signin/authentication-modal'

export const metadata: Metadata = {
  title: 'Principal',
  description: 'Pagina inicial do meu sistema',
  keywords:
    'Fabiano Bispo Canedo, Fabiano Bispo, fabiano bispo, fabianoobispo, @fabianoobispo, fabiano bispo canedo',
}

export default function auth2() {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/*  <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2"> */}
      <p className="text-lg">
        {/* &ldquo;Esta biblioteca me poupou incontáveis horas de trabalho e
              me ajudou a entregar designs impressionantes para meus clientes mais rápido do que nunca.&rdquo; */}
        {/* &ldquo;Um texto....&rdquo; */}
      </p>
      {/*    </blockquote>
        </div>
      </div>
 */}
      {/*     <ResetPasswordEmail idReset="12" nome="fabiano" /> */}
      <AuthenticationModal />
    </div>
  )
}
