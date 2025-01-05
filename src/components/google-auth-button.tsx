'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { Icons } from './icons'
import { LoadingButton } from './ui/loading-button'

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  async function handleLogin() {
    setLoading(true)

    const result = await signIn('google', {
      callbackUrl: callbackUrl ?? '/dashboard',
    })
    if (result?.error) {
      console.log(result)
    } else {
      setLoading(false)
      /*  window.location.href = result?.url ?? '/dashboard'; */
    }
    setLoading(false)
  }
  return (
    <LoadingButton
      className="w-full"
      variant="outline"
      type="button"
      loading={loading}
      onClick={() => handleLogin()}
    >
      <Icons.google className="mr-2 h-4 w-4" />
      Continue Com Google
    </LoadingButton>
  )
}
