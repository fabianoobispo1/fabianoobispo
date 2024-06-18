import Spinner from "@/components/Spinner";

export default function loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="flex h-20 w-40 items-center justify-center rounded-md bg-white shadow-md">
        <Spinner height="2rem" width="2rem" />
      </div>
    </div>
  );
}
