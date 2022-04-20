//import { GetStaticProps } from 'next'
import Head from 'next/head'
//import { SubscribeButton } from '../components/SubscribeButton';
//import { stripe } from '../services/stripe';

import styles from './home.module.scss';

interface HomePropos {
  product: {
    priceId: string;
    amount: number;
  }
}

export default function Home() {
  return(
    <>
      <Head>
        <title>Home | Ig.News</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👏 Ei, bem vindo</span>
          <h1>Noticias e Dicas sobre o mundo <span>React.</span></h1>
          <p>
            Tenha acesso a todas as publicações <br />
            {/* <span>por {product.amount} mes</span> */}
          </p>

          {/* <SubscribeButton priceId={product.priceId}/> */}
        </section>

        <img src="/images/avatar.svg" alt="Gril coding" />
      </main>

    </>  
  )
}


/* export const getStaticProps: GetStaticProps  = async () => {
  const price = await stripe.prices.retrieve('price_1Ib8wcGjGEE5dShGhGAu5Elb')
  
  const product = {
    priveId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style:'currency',
      currency: 'USD'
    }).format(price.unit_amount /100),
  };
  
    return {
    props: {
      product,
    }, 
    revalidate:60 * 60 * 24, //24hr
  }
  }
 */