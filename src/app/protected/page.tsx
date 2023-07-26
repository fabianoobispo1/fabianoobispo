import LogoutButton from '../components/buttons/LogoutButton'
import { getServerSession } from 'next-auth'

export default async function Protected() {
  const session = await getServerSession()
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center">
      <div className="my-10 flex w-full justify-between ">
        <h1 className=" text-2xl font-bold">Protected Page</h1>
        <LogoutButton />
      </div>
      <pre className="w-full whitespace-pre-wrap break-words rounded bg-gray-900 p-4">
        {JSON.stringify(session, null, 2)}
      </pre>
    </main>
  )
}
