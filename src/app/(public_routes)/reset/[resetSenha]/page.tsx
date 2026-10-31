import Link from 'next/link'

/**
 * Recuperação de senha desativada.
 *
 * O fluxo anterior rodava inteiro no navegador e permitia trocar a senha de
 * qualquer conta (ver convex/recuperaSenha.ts). Fica desligado até existir
 * envio de e-mail e uma troca de senha validada no servidor.
 */
export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">
        Recuperação de senha indisponível
      </h1>
      <p className="max-w-md text-muted-foreground">
        A redefinição de senha por link está temporariamente desativada. Se você
        criou a conta com Google ou GitHub, entre por eles.
      </p>
      <Link href="/entrar" className="underline underline-offset-4">
        Voltar para o login
      </Link>
    </div>
  )
}
