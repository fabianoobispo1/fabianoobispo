"use client";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import ModalCadastro from "./ModalCadastro";

export default function ModalLogin() {
  const [openModal, setOpenModal] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  async function loginUsuario() {
    const email = emailInputRef.current?.value;
    const password = passwordInputRef.current?.value;

    if (email && password) {
      const response = await fetch("/api/usuario/autenticacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Usuário logado com sucesso.");
        // Fechar o modal após o cadastro
        setOpenModal(false);
      } else {
        toast.error(data.message);
      }
    } else {
      toast.error("Por favor, preencha todos os campos.");
    }

    /* store.setRequestLoading(true); */
    try {
      /*  const token = await apiLoginUser(JSON.stringify(credentials));
  
        if (token) {
          store.setToken(token);
  
          toast.success("Conectado com sucesso");
          return router.push("/dashboard");
        } else {
          toast.error("Error");
        } */
    } catch (error: any) {
      /*  console.log(error);
        if (error instanceof Error) {
          handleApiError(error);
        } else {
          toast.error(error.message);
          console.log("Error message:", error.message);
        } */
    } finally {
      /*         store.setRequestLoading(false); */
    }
  }

  return (
    <>
      <Button onClick={() => setOpenModal(true)}>Login</Button>
      <Modal
        show={openModal}
        size="md"
        popup
        onClose={() => setOpenModal(false)}
        initialFocus={emailInputRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Faça login em nossa plataforma
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="email" value="Seu Email" />
              </div>
              <TextInput
                id="email"
                ref={emailInputRef}
                placeholder="nome@exemplo.com.br"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="password" value="Sua senha" />
              </div>
              <TextInput
                id="password"
                type="password"
                ref={passwordInputRef}
                required
              />
            </div>
            <div className="flex justify-between">
              {/* <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember">Lembrar-me</Label>
                </div> */}

              <button
                className="cursor-pointer text-sm text-cyan-700 hover:underline dark:text-cyan-500"
                onClick={() => {}}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="w-full">
              <Button onClick={() => loginUsuario()}>
                Inicie sessão na sua conta
              </Button>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-300">
              Não é cadastrado?&nbsp;
              <ModalCadastro
                buttontitle="Criar conta"
                openModalInicial={false}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
