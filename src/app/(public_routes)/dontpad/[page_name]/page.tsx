export default async function DontPadPage({
  params,
}: {
  params: Promise<{ page_name: string }>
}) {
  const page_name = (await params).page_name

  return (
    <div className="relative h-screen flex-col items-center justify-center ">
      <h1>{page_name}</h1>
    </div>
  )
}
