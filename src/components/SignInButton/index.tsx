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
        className={styles.SignInButton}
         
        >
        
            <FaGithub
            color="#04d361"
            />
            {session?.user?.name}

            <VscGear 
            color="#737380"
            className={styles.gearIncon}
            onClick={() => router.push('/acount')} 
            />


            <FiX 
            color="#737380"
            className={styles.closeIncon}
            onClick={() => signOut({callbackUrl: "/"})} 
            />
           
            
        </button>
    ) : (
        <button
        /* disabled={true} */
        type="button"
        className={styles.SignInButton}
        onClick={() => signIn('github')}
      
        >
            <FaGithub
            color="#eba417"
            />
            Sign in with GitHub
        </button>
    ); 
}