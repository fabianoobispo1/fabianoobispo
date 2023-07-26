import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'

export default async function LoginLogoutButton() {
  const session = (await getServerSession()) || {}

  if (Object.keys(session).length !== 0) {
    redirect('/protected')
  }

  return (
    <>
      {Object.keys(session).length === 0 ? <LoginButton /> : <LogoutButton />}
    </>
  )
}
