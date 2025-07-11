import DontpadText from './dontpad-text'

export default async function DontPadPage({
  params,
}: {
  params: Promise<{ page_name: string | string[] }>
}) {
  const resolvedParams = await params
  const page_name = Array.isArray(resolvedParams.page_name)
    ? resolvedParams.page_name.join('/')
    : resolvedParams.page_name

  return (
    <div className="relative h-screen flex-col items-center justify-center ">
      <DontpadText page_name={page_name} />
    </div>
  )
}
