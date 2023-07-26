import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import LoginButton from './components/buttons/LoginButton'
import LogoutButton from './components/buttons/LogoutButton'
import GithubButton from './components/buttons/GithubButton'

export default async function Home() {
  const session = (await getServerSession()) || {}

  if (Object.keys(session).length !== 0) {
    redirect('/protected')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24">
      <div className="fixed bottom-0 left-0 flex h-2 w-full items-center justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
        <div className="px-2"></div>
        {Object.keys(session).length === 0 ? <LoginButton /> : <LogoutButton />}
      </div>

      <div className="relative flex place-items-center">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="grid grid-cols-1 gap-y-4 md:grid-cols-1 md:gap-x-6">
        {/*   <GoogleButton />
        <DiscordButton /> */}
        <GithubButton />
      </div>
    </main>
  )
}
