import { db } from '@/db'
import { users } from '@/db/schema'

export default async function Home() {
  const allUsers = await db.select().from(users)

  async function addUser(data: FormData) {
    'use server'

    const fullName = data.get('full_name')?.toString()
    const phone = data.get('phone')?.toString()

    if (!fullName || !phone) {
      return
    }
    await db.insert(users).values({
      fullName,
      phone,
    })
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-900 text-zinc-50">
      <p className="text-cyan-300">{JSON.stringify(allUsers, null, 2)}</p>
      <form action={addUser} className="flex flex-col gap-3">
        <input
          type="text"
          name="full-name"
          placeholder="full_name"
          className="bg-zinc-800"
        />
        <input
          type="text"
          name="phone"
          placeholder="phone"
          className="bg-zinc-800"
        />

        <button type="submit">Creeate</button>
      </form>
    </div>
  )
}
