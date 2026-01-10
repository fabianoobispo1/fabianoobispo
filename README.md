# 🚀 Portfólio Fabiano Bispo

Portfólio profissional e sistema de gestão pessoal desenvolvido com as tecnologias mais modernas do mercado.

## ✨ Funcionalidades

- 🎨 **Landing Page Moderna** - Portfólio profissional com design responsivo
- 💰 **Sistema Financeiro Completo** - Gestão de receitas, despesas, cartões e relatórios
- 🏋️ **Ficha de Treinos** - Gerenciamento completo de exercícios e treinos
- 📝 **DontPad Clone** - Editor de texto colaborativo em tempo real
- 🔐 **Autenticação Completa** - Multi-provider (Google, GitHub, Credentials)
- 📊 **Dashboard Interativo** - Visualização de dados com gráficos
- 🌓 **Dark/Light Mode** - Tema personalizável
- 📱 **Totalmente Responsivo** - Funciona perfeitamente em qualquer dispositivo

## 🛠️ Tecnologias

### Frontend

- **Framework** - [Next.js 15](https://nextjs.org) (App Router)
- **Linguagem** - [TypeScript](https://www.typescriptlang.org)
- **Estilização** - [Tailwind CSS](https://tailwindcss.com)
- **Componentes** - [Shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
- **Formulários** - [React Hook Form](https://react-hook-form.com)
- **Validação** - [Zod](https://zod.dev)
- **Gráficos** - [Chart.js](https://www.chartjs.org) + [Recharts](https://recharts.org)

### Backend

- **Database/BaaS** - [Convex](https://convex.dev)
- **Autenticação** - [NextAuth v5](https://next-auth.js.org)
- **Upload de Arquivos** - [Uploadthing](https://uploadthing.com)
- **Email** - [Resend](https://resend.com)
- **Pagamentos** - [Stripe](https://stripe.com)

### DevOps & Ferramentas

- **Linting** - [ESLint](https://eslint.org)
- **Formatação** - [Prettier](https://prettier.io)
- **Deploy** - [Vercel](https://vercel.com)
- **Analytics** - Vercel Analytics & Speed Insights

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no [Convex](https://convex.dev)
- (Opcional) Contas OAuth (Google, GitHub)

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/fabianoobispo/fabianoobispo.git
cd fabianoobispo
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# OAuth Providers (Opcional)
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Opcional)
RESEND_API_KEY=your_resend_api_key

# Upload (Opcional)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

4. **Configure o Convex**

```bash
npx convex dev
```

5. **Execute o projeto**

Em outro terminal:

```bash
npm run dev
```

6. **Acesse a aplicação**

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                      # Rotas Next.js 15 (App Router)
│   ├── (dashboard)/         # Rotas protegidas
│   │   └── dashboard/       # Dashboard principal
│   ├── (public_routes)/     # Rotas públicas
│   └── api/                 # API Routes
├── components/              # Componentes React
│   ├── ui/                  # Componentes UI (Shadcn)
│   ├── portfolio/           # Componentes do portfólio
│   ├── financas/           # Componentes financeiros
│   └── forms/              # Formulários
├── auth/                    # Configuração NextAuth
├── lib/                     # Utilitários
└── providers/              # Providers (Convex, Auth)

convex/                      # Backend Convex
├── schema.ts               # Schema do banco de dados
├── financeiro.ts           # Funções financeiras
├── workout.ts              # Funções de treino
└── ...                     # Outras funções backend
```

## 🎨 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção
npm run lint         # Executa ESLint
npm run format       # Formata código com Prettier
```

## 🚢 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Conecte o repositório no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático!

### Convex Deploy

```bash
npx convex deploy
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contato

<div> 
  <a href="https://instagram.com/fabianoobispo" target="_blank"><img src="https://img.shields.io/badge/-Instagram-%23E4405F?style=for-the-badge&logo=instagram&logoColor=white" target="_blank"></a>
  <a href="https://www.linkedin.com/in/fabiano-bispo-canedo-422738109/" target="_blank"><img src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank"></a> 
</div>

<!--
usando como base https://github.com/xipanca/nextjs-ts-nextauth-convex/blob/main/src/components/ui/input.tsx mas agarrei na parte de fazer login
para regsitrar esta funcionando usnado o convex -->

<!-- https://github.com/GabrielCenteioFreitas/estudos-fullstackclub-fsw6_finance/tree/main -->
