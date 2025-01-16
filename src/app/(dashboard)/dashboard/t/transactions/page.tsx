import { TransactionsPage } from './Transactions'

export default function page() {
  return (
    <div
      className={
        'space-y-4 w-screen pr-4 dark antialiased md:max-w-[calc(100%-18rem)]'
      }
    >
      <TransactionsPage />
    </div>
  )
}
