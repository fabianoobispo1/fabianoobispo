import { Boundary } from './components/boundary'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl space-y-1 px-2 pt-20 lg:px-8 lg:py-8">
      <div className="bg-vc-border-gradient rounded-lg p-px shadow-lg shadow-black/20">
        <div className="rounded-lg bg-black"></div>
      </div>
      <div className="bg-vc-border-gradient rounded-lg p-px shadow-lg shadow-black/20">
        <div className="rounded-lg bg-black p-3.5 lg:p-6">
          <Boundary labels={['Error']} color="default">
            <div className="text-vercel-pink space-y-4">
              <h2 className="text-lg font-bold">Página nao encontrada</h2>

              <p className="text-sm">...</p>
            </div>
          </Boundary>
        </div>
      </div>
    </div>
  )
}
