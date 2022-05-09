import styles from './styles.module.scss';
import {FaGithub} from 'react-icons/fa';
import {FiX} from 'react-icons/fi';
import { VscGear } from "react-icons/vsc";
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from "next/router";

export function SignInButton() {
    const {data: session} = useSession();    
    const router = useRouter();
   
   return session ? (
        <button         
        type="button"
        className="h-12 rounded-full py-0 px-5 bg-gray-800 border-0  flex items-center justify-center  text-white font-bold transition-opacityque tem que "         
        >
        
            <FaGithub 
            className="w-5 h-5 mr-4"
            color="#04d361"
            />
            {session?.user?.name}

            <VscGear 
            color="#737380"
            className="ml-4"
            onClick={() => router.push('/acount')} 
            />


            <FiX 
            color="#737380"
            className="ml-4"
            onClick={() => signOut({callbackUrl: "/"})} 
            />
           
            
        </button>
    ) : (
        <button
        /* disabled={true} */
        type="button"
        className="h-12 rounded-full py-0 px-5 bg-gray-800 border-0  flex items-center justify-center  text-white font-bold"         
        onClick={() => signIn('github')}
      
        >
            <FaGithub
            color="#eba417"
            className="w-5 h-5 mr-4"
            />
            Sign in with GitHub
        </button>
    ); 
}



/* 
.SignInButton{
    height: 3rem;
    border-radius: 3rem;
    background: var(--gray-850);
    border: 0;
    padding: 0 1.5rem;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--white);
    font-weight: bold;

    svg{
        width: 20px;
        height: 20px;
    }

    svg:first-child {
        margin-right: 1rem;
    }
    
    svg.closeIncon {
        margin-left: 1rem;
    }

    svg.gearIncon {
        margin-left: 1rem;
    }
    

    transition: filter 0.2s;
    &:hover{
        filter: brightness(0.8);
    }
}
 */