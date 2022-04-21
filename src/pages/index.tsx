import { GetStaticProps } from 'next'
import Head from 'next/head'
import { SubscribeButton } from '../components/SubscribeButton';
import { stripe } from '../services/stripe';

import styles from './home.module.scss';

interface HomePropos {
  product: {
    priceId: string;
    amount: number;
  }
}

export default function Home({product}: HomePropos) {
  return(
    <>
      <Head>
        <title>Home | Ig.News</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👏 Ei, bem vindo</span>
          <h1>Teste de assinaturas usando o <span>Stripe.</span></h1>
          <p>
            Site criado para fins de estudo  <br />
            e conehcer a feramenta stripe.<br />
            <span>Valor assinatura {product.amount} mês</span>
          </p>

          <SubscribeButton priceId={product.priceId}/>
      
        </section>

        <img src="/images/avatar.svg" alt="Gril coding" />
      </main>

    </>  
  )
}


export const getStaticProps: GetStaticProps  = async () => {
  const price = await stripe.prices.retrieve('price_1Kqh9EGjGEE5dShG2ApT2GBg')
  
  const product = {
    priveId: price.id,
    amount: new Intl.NumberFormat('pt-BR', {
      style:'currency',
      currency: 'BRL'
    }).format(price.unit_amount /100),
  };

    return {
    props: {
      product,
    }, 
    revalidate:60 * 60 * 24, //24hr
  }
  }
 