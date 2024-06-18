import { Boundary } from "./components/boundary";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl space-y-1 px-2 pt-20 lg:p-8">
      <div className=" rounded-lg p-px shadow-lg shadow-black/20">
        <div className="rounded-lg bg-black"></div>
      </div>
      <div className=" rounded-lg p-px shadow-lg shadow-black/20">
        <div className="rounded-lg bg-black p-3.5 lg:p-6">
          <Boundary labels={["Error"]} color="default">
            <div className="space-y-4 text-white">
              <h2 className="text-lg font-bold">Página não encontrada</h2>

              <p className="text-sm">...</p>
            </div>
          </Boundary>
        </div>
      </div>
    </div>
  );
}
