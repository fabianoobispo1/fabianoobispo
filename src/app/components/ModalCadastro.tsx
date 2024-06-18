"use client";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

type ModalProps = {
  openModalInicial: boolean;
  buttontitle: string;
};

export default function ModalCadastro({
  openModalInicial,
  buttontitle,
}: ModalProps) {
  const [openModal, setOpenModal] = useState(openModalInicial);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const nameImputRef = useRef<HTMLInputElement>(null);
  const passwordImputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordImputRef = useRef<HTMLInputElement>(null);

  async function cadastroUsuario() {
    const email = emailInputRef.current?.value;
    const name = nameImputRef.current?.value;
    const password = passwordImputRef.current?.value;
    const confirmPassword = confirmPasswordImputRef.current?.value;

    if (email && name && password && confirmPassword) {
      if (password !== confirmPassword) {
        toast.error("As senhas não correspondem.");
        return;
      }

      const response = await fetch("/api/usuario/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, password, confirmPassword }),
      });

      /*  const queryParams = new URLSearchParams({ email, name, password, confirmPassword }).toString();
      const response = await fetch(`/api/usuario/login?${queryParams}`, {
        method: 'GET',
      }); */

      const data = await response.json();

      if (response.ok) {
        console.log(response);
        toast.success("Usuário cadastrado com sucesso.");
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
      <button
        className=" cursor-pointer text-sm text-cyan-700 hover:underline dark:text-cyan-500"
        onClick={() => setOpenModal(true)}
      >
        {buttontitle}
      </button>
      <Modal
        show={openModal}
        popup
        onClose={() => setOpenModal(false)}
        initialFocus={nameImputRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-4">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Faça seu Cadastro
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="name" value="Nome" />
              </div>
              <TextInput
                id="name"
                ref={nameImputRef}
                placeholder="João"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="email" value="Email" />
              </div>
              <TextInput
                id="email"
                ref={emailInputRef}
                placeholder="nome@exemplo.com.br"
                required
              />
            </div>
            <div className="flex w-full flex-row gap-4 ">
              <div className="w-1/2">
                <div className="mb-2 block">
                  <Label htmlFor="password" value="Senha" />
                </div>
                <TextInput
                  id="password"
                  type="password"
                  ref={passwordImputRef}
                  required
                />
              </div>
              <div className="w-1/2">
                <div className="mb-2 block">
                  <Label htmlFor="confirmpassword" value="Confirma senha" />
                </div>
                <TextInput
                  id="confirmpassword"
                  type="password"
                  ref={confirmPasswordImputRef}
                  required
                />
              </div>
            </div>
            {/* <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
                <a href="#" className="text-sm text-cyan-700 hover:underline dark:text-cyan-500">
                  Lost Password?
                </a>
              </div> */}
            <div className="w-full">
              <Button onClick={() => cadastroUsuario()}>Cadastrar</Button>
            </div>
            {/* <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-300">
                Not registered?&nbsp;
                <a href="#" className="text-cyan-700 hover:underline dark:text-cyan-500">
                  Create account
                </a>
              </div> */}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
