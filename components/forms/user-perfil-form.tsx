'use client';
import { Heading } from '@/components/ui/heading';
import { Button } from '../ui/button';
import { Trash } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {  Form, FormControl, FormField, FormItem, FormLabel, FormMessage  } from '@/components/ui/form';
import { perfilSchema, type PerfilFormValues } from '@/lib/form-schema';
import {SubmitHandler,  useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

export const PerfilUser: React.FC = () => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [bloqueioPorvider, setBloqueioPorvider] =useState(false);
    const [sesion, setSesion] = useState([])
    const [umavez, setUmavez] = useState(true)



    const { data: session } = useSession();

    useEffect(() => {
    if (umavez) {
        console.log('passou ')
        if (session?.user.provider != "Credentials") {
            setBloqueioPorvider(true)
        }
        setUmavez(true)
        console.log(session)
    }
    },[])

    const defaultValues = {
        nome: session?.user.name || '',
        email: session?.user.email || ''
    };

    const form = useForm<PerfilFormValues>({
        resolver: zodResolver(perfilSchema),
        defaultValues,
        mode: 'onChange'
    });


    const processForm: SubmitHandler<PerfilFormValues> = (data) => {
    console.log('data ==>', data);
    setData(data);
    // api call and reset
    // form.reset();
    };

      

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading title={'Perfil'} description={'Editar suas informações pessoais.'} />       
            </div>
            <Separator />

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(processForm)}
                    className="w-full space-y-8"
                >
                    <div className='gap-8 md:grid md:grid-cols-2'>

                    <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input
                                disabled={loading}
                                
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                disabled={loading || bloqueioPorvider}
                                
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
         
                    </div>

                    <Button disabled={loading } className="ml-auto" type="submit">
                        Slavar
                    </Button>
                </form>
            </Form>
        </>

    )
  }