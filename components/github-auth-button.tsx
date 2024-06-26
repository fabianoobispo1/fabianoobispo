'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from './ui/button';
import { Icons } from './icons';
import { LoadingButton } from './ui/loading-button';

export default function GitHubSignInButton(loading: any) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  return (
    <LoadingButton
      className="w-full"
      variant="outline"
      type="button"
      loading={loading}
      onClick={() =>
        signIn('github', { callbackUrl: callbackUrl ?? '/dashboard' })
      }
    >
      <Icons.gitHub className="mr-2 h-4 w-4" />
      Continue Com Github
    </LoadingButton>
  );
}
