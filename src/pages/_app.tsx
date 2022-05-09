import type { AppProps } from 'next/app'
import '../styles/global.scss';

import {Header} from '../components/Heder'
import { SessionProvider  as NextAuthProvider } from 'next-auth/react'
import {Widget} from '../components/Widget/Widget'

import '../styles/globals.css'
function MyApp({ Component, pageProps }: AppProps) {
  return(
    <NextAuthProvider session={pageProps.session}>
      <Header />    
      <Component {...pageProps} />
      <Widget />
    </NextAuthProvider>  
  
  
  )
}

export default MyApp
