import { Boundary } from "./components/boundary";

export default function NotFound() {
  return (
    <Boundary labels={["Error"]} color="default">
      <div className="text-vercel-pink space-y-4">
        <h2 className="text-lg font-bold">Página nao encontrada</h2>

        <p className="text-sm">...</p>
      </div>
    </Boundary>
  );
}
