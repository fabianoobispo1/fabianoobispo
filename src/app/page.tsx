import Redirecionador from '@/components/redirecionador'

export default function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center ">
      <Redirecionador link={'/entrar'} />
    </div>
  )
}
