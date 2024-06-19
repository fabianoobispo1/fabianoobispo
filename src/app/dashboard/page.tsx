"use client";
import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-start justify-start p-6">
      <h1>Dashboard</h1>
      <Button onClick={() => handleLogout()}>sair</Button>
    </main>
  );
}
