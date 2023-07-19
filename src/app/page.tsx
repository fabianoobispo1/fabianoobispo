import { db } from '@/db'
import { users } from '@/db/schema'

export default async function Home() {
  const allUsers = await db.select().from(users)
  console.log(allUsers)
  return <p className="text-cyan-300">{JSON.stringify(allUsers, null, 2)}</p>
}
