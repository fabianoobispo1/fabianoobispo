'use client';
import UserAuthForm from '@/components/forms/user-auth-form';
import UserRegisterForm from '@/components/forms/user-register-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function AuthenticationModal() {
  const [button, setButton] = useState('Cadastrar');
  return (
    <>
      <button
        onClick={() =>{button=='Cadastrar'? setButton('Login'):setButton('Cadastrar')}}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 md:right-8 md:top-8'
        )}
      >
        {button}
      </button>
     
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {button=='Login'?   'Criar uma conta': 'Realizar login'}
            
            </h1>
            <p className="text-sm text-muted-foreground">
            {button=='Login'?   'Digite seu e-mail abaixo para criar sua conta': 'Digite seu e-mail abaixo para realizar login'}
              
            </p>
          </div>
          {button=='Login'?  <UserRegisterForm/>: <UserAuthForm />}         
         {/*  <p className="px-8 text-center text-sm text-muted-foreground">
            Ao clicar em continuar, você concorda com o nosso{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Política de privacidade
            </Link>
            .
          </p> */}
        </div>
      </div>    
    </>
  );
}
