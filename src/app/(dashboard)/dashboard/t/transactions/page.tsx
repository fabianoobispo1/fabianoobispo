'use client'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

import { TransactionsPage } from './Transactions'

export default function Page() {
  const { open } = useSidebar()
  return (
    <div
      className={cn(
        'space-y-8 w-screen pr-4 md:pr-1  h-[calc(100vh-220px)]',
        open ? 'md:max-w-[calc(100%-16rem)] ' : 'md:max-w-[calc(100%-5rem)] ',
      )}
    >
      <TransactionsPage />
    </div>
  )
}
