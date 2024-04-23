"use client";

import { LoginUserInput, LoginUserSchema } from "@/lib/validations/user.schema";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { apiLoginUser } from "@/lib/api-requests";
import FormInput from "@/components/FormInput";
import Link from "next/link";
import { LoadingButton } from "@/components/LoadingButton";
import useStore from "@/store";
import { handleApiError } from "@/lib/helpers";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { space } from "postcss/lib/list";

export default function LoginForm() {
  const store = useStore();
  const router = useRouter();
  
  const [statusApi, setStatusApi] = useState('off')
  
  const [cont, setCont] = useState(1)

  const methods = useForm<LoginUserInput>({
    resolver: zodResolver(LoginUserSchema),
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods;

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitSuccessful]);

  useEffect(() => {
    store.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    verificaApi()


  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cont])


  async function verificaApi() {
    try {
      const headers: Record<string, string> = {
       "Content-Type": "application/json",
     };    
     const response = await api('/', {method: 'GET',headers} )

     if (response.status === 200){
      setStatusApi('ON') 
     }else{
      setStatusApi('OFF') 
      setCont(cont + 1)
     }
     } catch (error: any) {
      setStatusApi('OFF')    
        setCont(cont + 1)
     } 
    
  }

  async function LoginUserFunction(credentials: LoginUserInput) {
    store.setRequestLoading(true);
    try {
      const token = await apiLoginUser(JSON.stringify(credentials));
      
      if(token){
        store.setToken(token)
  
        toast.success("Conectado com sucesso");
        return router.push("/dashboard");
      }else{
        toast.error("Error")
      }
    } catch (error: any) {
      console.log(error);
      if (error instanceof Error) {
        handleApiError(error);
      } else {
        toast.error(error.message);
        console.log("Error message:", error.message);
      }
    } finally {
      store.setRequestLoading(false);
    }
  }

  const onSubmitHandler: SubmitHandler<LoginUserInput> = (values) => {
    LoginUserFunction(values);
  };

  return (
    
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="max-w-md w-full mx-auto overflow-hidden shadow-lg bg-ct-dark-200 rounded-2xl p-8 space-y-5"
      >
        <FormInput label="Email" name="email" type="email" />
        <FormInput label="Senha" name="password" type="password" />

        <div className="text-right">
          <Link href="#" className="">
            Esqueceu a senha?(breve)
          </Link>
        </div>
        <LoadingButton
          loading={store.requestLoading}
          textColor="text-ct-blue-600"
        >
          Entrar
        </LoadingButton>
        <span className="block">
          Precisa de uma conta?{" "}
          <Link href="/register" className="text-ct-blue-600">
            Registar aqui
          </Link>
        </span>
        <p>Status api {statusApi == 'ON'?
                      <span className="text-green-700 font-semibold">ON</span>
                      :
                      <span className=""> 
                        <span className="w-2 h-2 ml-2 rounded-full bg-red-500 inline-block animate-flash"></span>
                        <span className="w-2 h-2 ml-2 rounded-full bg-red-500 inline-block animate-flash [ :0.2s]"></span>
                        <span className="w-2 h-2 ml-2 rounded-full bg-red-500 inline-block animate-flash [animation-delay:0.4s]"></span>
                      </span>}
        </p>

 
      </form>
    </FormProvider>
   
    
    

  );
}