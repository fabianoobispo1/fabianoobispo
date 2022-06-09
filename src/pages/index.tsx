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
          <h1>Testes para novas <span>Tecnologias.</span></h1>
          <p>
            Aqui e onde testo nosvas ferramentas <br />
            e Tecnologias<br />
            <span>NextJS, NodeJS, mongoDB, auth, sass...</span>
          </p>

          {/* <SubscribeButton priceId={product.priceId}/> */}
      
        </section>

        <img src="/images/vortex-of-delight-2.svg" alt="Gril coding" />
      </main>

    </>  
  )
}


export const getStaticProps: GetStaticProps  = async () => {
  const price = await stripe.prices.retrieve('price_1Kqh9EGjGEE5dShG2ApT2GBg')
  
 
  

/*   var n1 = numerosorteado();
  var n2 = numerosorteado();
  var n3 = numerosorteado();
  var n4 = numerosorteado();
  var n5 = numerosorteado();
  var n6 = numerosorteado();
  var a = [n1, n2,n3,n4,n5,n6]

  count_duplicate(a)
  function count_duplicate(a){
    let counts = {}
   
    for(let i =0; i < a.length; i++){ 
        if (counts[a[i]]){
        counts[a[i]] += 1
        } else {
        counts[a[i]] = 1
        }
       }  
       for (let prop in counts){
           if (counts[prop] >= 2){
               console.log(prop + " counted: " + counts[prop] + " times.")
           }
       }
     console.log(counts)
   }
   
  
  function numerosorteado() {
    var n1d1 = 0;
    var n1d2 = 0;
  
    n1d1 = getRandomArbitrary(0, 10);
    n1d2 = getRandomArbitrary(0, 10);
  
    var n1 = `${n1d1}${n1d2}`;
    var n2 = parseInt(n1);
    
    var cont = true;
    while (cont) {
      if (n2 == 0) {       
        cont = false;
      }else if(n2 < 61){       
        cont = false;
      } else {
        n1d1 = getRandomArbitrary(0, 7);
        n1d2 = getRandomArbitrary(0, 10);
  
        var n1 = `${n1d1}${n1d2}`;
        n2 = parseInt(n1);
      }
    }
    return n2;
  }
  
  function getRandomArbitrary(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  var result =
    "resultado : " +
    n1 +
    " - " +
    n2 +
    " - " +
    n3 +
    " - " +
    n4 +
    " - " +
    n5 +
    " - " +
    n6;
  console.log(result);
 */

  const product = {
    priveId: price.id,
    amount: new Intl.NumberFormat('pt-BR', {
      style:'currency',
      currency: 'BRL'
    }).format(Number(price?.unit_amount)/100),
  };

    return {
    props: {
      product,
    }, 
    revalidate:60 * 60 * 24, //24hr
  }
  }
 