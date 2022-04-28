import { GetStaticProps } from 'next'
import Head from 'next/head'
import { SubscribeButton } from '../components/SubscribeButton';
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from "next/router";

import styles from './acount.module.scss';



export default function Acount() {

  

  return (
    <>
      <Head>
        <title>Acount | Ig.News</title>
      </Head>
      <main className={styles.contentContainer}>         
        <h1>Pagina para exibir informacoes de cadastro</h1>
          


      

      </main>

    </>  

)
}
