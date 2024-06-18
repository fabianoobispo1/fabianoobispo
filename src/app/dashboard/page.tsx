/* import { apiGetAuthUser } from "@/lib/api-requests";
import { cookies } from "next/headers";
import { AuthPageInvisible } from "@/lib/protect-page";
import ListUsuarios from "./listUsuarios"; */
import HeaderV2 from "@/components/HeaderV2";

export default async function DashboardPage() {
  /*   const cookieStore = cookies();
  const token = cookieStore.get("tokenjfimperadores");
  const user = await apiGetAuthUser(token?.value);  */

  return (
    <>
      <HeaderV2 />
      <section className="absolute  right-0 top-0  min-h-screen w-full bg-ct-blue-600 p-1 pt-20 lg:w-5/6">
        <div className="mx-auto flex h-80 max-w-4xl items-center justify-center rounded-md bg-ct-dark-100 p-1 max-sm:h-80">
          <div>
            <p className="mb-3 pt-4 text-center text-5xl font-semibold">
              Bem vindo D{/* , {user.name} */}
            </p>
            <div className="m-2 mt-8">
              {/*  <p className="mb-3">Id: {user.id}</p> */}
              <p className="mb-3">
                Aqui pode ficar algumas informações iniciais.
              </p>

              {/*   <ListUsuarios /> */}
            </div>
          </div>
        </div>
      </section>
      {/*       <AuthPageInvisible /> */}
    </>
  );
}
