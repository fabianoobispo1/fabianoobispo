import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from 'next-auth/providers/github';
import prisma from './lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''/* ,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      } */
    }),
    CredentialProvider({
      credentials: {
        email: {
          type: 'email'
        },
        password: {
          type: 'password'
        }
      }, 

      
      async authorize(credentials, req) {
        let email
        if (credentials?.email ){
          email = credentials?.email as string
        }else{
          return null;
        }

        const usuario  = await prisma.user.findUnique({
          where: {
            email
          },
        });
    
        if (!usuario ) {
          return null;
        }
        const user = {
          id: usuario.id,
          name: usuario.nome,
          email: credentials?.email as string,
          tipo: usuario.tipo,
          provider: usuario.provider

        };
        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    })
  ],
  pages: {
    signIn: '/' //sigin page
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' || account?.provider === 'google' ) {
        const provider = account?.provider 
        const email = profile?.email;
        if(email){
          let usuario = await prisma.user.findUnique({
            where: { email }
          });
  
          if (!usuario) {
            usuario = await prisma.user.create({
              data: {
                email,
                nome: String(profile.name),
                password_hash:uuidv4(),
                provider
              }
            });
          }
          
          
          user.id = usuario.id;
          user.tipo = usuario.tipo
          user.provider = usuario.provider
        }
       
       
      }
      return true;
    },
    async jwt({ token, user }) {
      // First time JWT callback is run, user object is available
      if (user) {
        token.id = user.id;
        token.tipo= user.tipo
        token.provider= user.provider
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = String(token.id);
        session.user.tipo = String(token.tipo);
        session.user.provider = String(token.provider)
      }
      return session;
    }
  }/* ,
  jwt: {
    maxAge: 60 * 60 * 24, // 1 dias
  } */
} satisfies NextAuthConfig;

export default authConfig;
