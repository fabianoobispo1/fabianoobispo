"use client";
/* import { apiGetAuthUser } from "@/lib/api-requests";
import { cookies } from "next/headers";

import ListUsuarios from "./listUsuarios"; */
import { apiLogoutUser } from "@/lib/api-requests";
import { AuthPageInvisible } from "@/lib/protect-page";
import useStore from "@/store";
import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  /*   const cookieStore = cookies();
  const token = cookieStore.get("tokenjfimperadores");
  const user = await apiGetAuthUser(token?.value);  */

  const store = useStore();
  const router = useRouter();

  const handleLogout = async () => {
    store.setRequestLoading(true);
    try {
      await apiLogoutUser();
    } catch (error) {
      console.log("");
    } finally {
      store.reset();
      router.push("/");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-start justify-start p-6">
      <h1>Dashboard</h1>
      <Button onClick={() => handleLogout()}>sair</Button>
      <AuthPageInvisible />
    </main>
  );
}
