import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import prisma from './lib/prisma';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
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
        console.log(credentials)

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
        console.log(usuario.id)
        const user = {
          id: usuario.id,
          name: usuario.nome,
          email: credentials?.email as string

        };
        console.log(user)
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
      if (account?.provider === 'github') {
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
                password_hash:''
              }
            });
          }
  
          user.id = usuario.id; // Adiciona o ID do banco de dados ao objeto user
        }
       
       
      }
      return true;
    },
    async jwt({ token, user }) {
      // First time JWT callback is run, user object is available
      if (user) {
        console.log(user.id)
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = String(token.id);
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export default authConfig;
