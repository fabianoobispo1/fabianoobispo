import LoginForm from "./login-form";

export default async function LoginPage() {
  return (
    <>
      <section className="grid min-h-screen bg-ct-blue-600 p-8  lg:place-items-stretch ">
        <div className="w-full">
          <h1 className="mb-4 text-center text-4xl font-[600] text-ct-yellow-600 lg:text-6xl">
            Entre
          </h1>
          <h2 className="mb-4 text-center text-lg text-ct-dark-200">
            Faça login para ter acesso
          </h2>
          <LoginForm />
        </div>
      </section>
    </>
  );
}
