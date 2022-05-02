import { GetStaticProps } from 'next'
import Head from 'next/head';
import {useState} from 'react';
import { SubscribeButton } from '../components/SubscribeButton';
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from "next/router";
import Modal, {ModalHeader, ModalBody, ModalFooter, useModal} from '../components/Modal'
import styles from './testes.module.scss';



export default function Acount() {
  const [IsModalVisible, setIsModalVisible] = useState(false)
  console.log(IsModalVisible)
  const { isShowing, toggle } = useModal();

  return (
    <>
      <Head>
        <title>Testes | Fabiano Bispo</title>
      </Head>
      <main className={styles.contentContainer}>         
        <h1>Pagina para testes</h1>
        <button onClick={()=> {setIsModalVisible(true)}}>exibir Modal</button>
          
        <button onClick={()=> {setIsModalVisible(false)}}>Fechar Modal</button>



        <button onClick={toggle}>
        Modal 
      </button>

      
        {/* <Modal {...{isShowing, toggle}}>
        <ModalHeader {...{toggle}}>
          My Title
        </ModalHeader>
        <ModalBody>
          Hello World!
        </ModalBody>
        <ModalFooter>
          <button onClick={toggle}>
            Cancel
          </button>
        </ModalFooter>        
      </Modal> */}

      </main>

    </>  

)
}
