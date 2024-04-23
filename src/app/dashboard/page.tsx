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
      <section className="bg-ct-blue-600  min-h-screen pt-20  w-full absolute top-0 right-0 lg:w-5/6 p-1">
        <div className="max-w-4xl mx-auto bg-ct-dark-100 rounded-md max-sm:h-[20rem] h-[20rem] p-1 flex justify-center items-center">
          <div>
            <p className="mb-3 text-5xl pt-4 text-center font-semibold">
              Bem vindo D{/* , {user.name} */}
            </p>
            <div className="mt-8 m-2">
             {/*  <p className="mb-3">Id: {user.id}</p> */}
              <p className="mb-3">Aqui pode ficar algumas informações iniciais.</p>
              
              {/*   <ListUsuarios /> */}
            </div>
          </div>
        </div>
      </section>
{/*       <AuthPageInvisible /> */}
    </>
  );
}
