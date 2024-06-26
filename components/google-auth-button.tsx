'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Icons } from './icons';
import { LoadingButton } from './ui/loading-button';

export default function GoogleSignInButton(loading: any) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  return (
    <LoadingButton
      className="w-full"
      variant="outline"
      type="button"
      loading={!loading}
      onClick={() =>
        signIn('google', { callbackUrl: callbackUrl ?? '/dashboard' })
      }
    >
      <Icons.google className="mr-2 h-4 w-4" />
      Continue Com Google
    </LoadingButton>
  );
}
