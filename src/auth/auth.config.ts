import { NextAuthConfig } from 'next-auth'
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import { z } from 'zod'
import { compare } from 'bcryptjs'

import { serviceMutation, serviceQuery } from '@/lib/server/convex-auth'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// Chamadas ao Convex feitas aqui usam o token de serviço (ainda não existe
// sessão durante o login). São as únicas que veem o hash da senha.
async function getUserByEmail(email: string) {
  return await serviceQuery(api.user.getAuthByEmailService, { email })
}

const authConfig = {
  trustHost: true,
  basePath: '/api/auth',
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '' /* ,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      } */,
    }),
    CredentialProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          throw new Error('Credenciais inválidas')
        }

        const { email, password } = parsedCredentials.data

        const user = await getUserByEmail(email)
        if (!user) {
          throw new Error('Usuário não encontrado')
        }
        if (user.password === '') {
          throw new Error('Entrar com provider')
        }

        const isMatch = await compare(password, user.password)
        if (!isMatch) {
          throw new Error('Senha incorreta')
        }
        return {
          id: user._id.toString(),
          image: user.image || '',
          email: user.email,
          role: user.role,
          nome: user.nome,
        }
      },
    }),
  ],
  pages: {
    signIn: '/entrar',
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'github' || account?.provider === 'google') {
        // Não logar `account`/`profile`: contêm access_token/id_token
        const provider = account.provider
        const email = profile?.email
        if (!email) return false

        const image =
          provider === 'google'
            ? (profile?.picture as string | undefined)
            : (profile?.avatar_url as string | undefined)

        const usuario = await serviceMutation(api.user.upsertOAuthService, {
          email,
          nome: String(profile?.name ?? email),
          provider,
          image: image || undefined,
        })
        user.image = usuario.image ?? ''
        user.nome = usuario.nome
        user.id = String(usuario._id)
        user.role = usuario.role
        return true
      }

      if (user?.id) {
        await serviceMutation(api.user.touchLoginService, {
          userId: user.id as Id<'user'>,
        })
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.image = user.image as string
        token.nome = user.nome as string
      }
      return token
    },

    async session({ session, token }) {
      if (token.role) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.image = token.image
        session.user.nome = token.nome
      }
      return session
    },
  },
  jwt: {
    maxAge: 60 * 60, // 1 h
  },
} satisfies NextAuthConfig

export default authConfig
