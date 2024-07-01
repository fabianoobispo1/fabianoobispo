import { Metadata } from 'next';
import AuthenticationModal from '@/components/signin/authentication-modal';

export const metadata: Metadata = {
  title: 'Principal',
  description: 'Pagina inicial do meu sistema'
};

export default function HomePage() {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Logo
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              {/* &ldquo;Esta biblioteca me poupou incontáveis horas de trabalho e
              me ajudou a entregar designs impressionantes para meus clientes mais rápido do que nunca.&rdquo; */}
              {/* &ldquo;Um texto....&rdquo; */}
            </p>
            <footer className="text-sm">Fabiano Bispo</footer>
          </blockquote>
        </div>
      </div>

      <AuthenticationModal />
    </div>
  );
}
