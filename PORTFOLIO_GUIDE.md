# 🎯 Portfólio - Estrutura e Navegação

## 📍 Estrutura do Portfólio

### Página Inicial (Landing Page)

**URL**: `/`

A landing page apresenta:

1. **Hero Section**
   - Apresentação profissional
   - Links para redes sociais (GitHub, LinkedIn, Instagram)
   - CTAs para ver projetos e contato

2. **Sobre Mim**
   - Destaque das principais competências
   - Cards com ícones e descrições

3. **Projetos em Destaque**
   - Sistema Financeiro Completo
   - Ficha de Treinos
   - DontPad Clone
   - Sistema de Transações
   - Cada projeto com tags de tecnologias e link de acesso

4. **Skills & Tecnologias**
   - Frontend (React, Next.js, TypeScript, etc.)
   - Backend (Convex, NextAuth, etc.)
   - Ferramentas (Git, Vercel, Stripe, etc.)
   - Conceitos (Server Components, Real-time, etc.)

5. **Contato**
   - Informações de contato
   - Email, localização, disponibilidade
   - CTA para enviar email

6. **Footer**
   - Links de navegação
   - Links de projetos
   - Redes sociais

### Dashboard

**URL**: `/dashboard/*` (Requer autenticação)

Área protegida com os seguintes módulos:

- `/dashboard/financas` - Sistema financeiro
- `/dashboard/fichaexercicios` - Gerenciamento de treinos
- `/dashboard/perfil` - Perfil do usuário
- `/dashboard/admin/*` - Área administrativa (apenas admins)

### Rotas Públicas

- `/entrar` - Login
- `/dontpad/[pagina]` - Editor de texto colaborativo
- `/reset` - Reset de senha

## 🎨 Personalização

### Cores e Tema

O projeto usa variáveis CSS para cores, permitindo fácil customização no arquivo `globals.css`:

```css
:root {
  --primary: ... --secondary: ......;
}
```

### Conteúdo

Para personalizar o conteúdo do portfólio, edite os arquivos em `src/components/portfolio/`:

- `hero-section.tsx` - Apresentação principal
- `about-section.tsx` - Sobre você
- `projects-section.tsx` - Seus projetos
- `skills-section.tsx` - Suas habilidades
- `contact-section.tsx` - Informações de contato

### Redes Sociais

Atualize os links em:

- `hero-section.tsx` (linha ~38)
- `footer.tsx` (linha ~52)

### Metadata SEO

Configure em `src/app/layout.tsx`:

- Title
- Description
- Keywords
- Open Graph tags

## 🔐 Fluxo de Autenticação

1. Visitante acessa `/` - Vê o portfólio
2. Clica em "Dashboard" - Redireciona para `/entrar`
3. Faz login (Credentials, Google ou GitHub)
4. Acessa área protegida `/dashboard`
5. Logout retorna para a landing page

## 📱 Responsividade

Todas as seções são totalmente responsivas:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎯 Call-to-Actions (CTAs)

1. **Ver Projetos** - Scroll para seção de projetos
2. **Entre em Contato** - Scroll para seção de contato
3. **Dashboard** - Link para área logada
4. **Enviar Email** - Abre cliente de email
5. **Ver Projeto** - Abre projeto específico

## 🚀 Próximos Passos para Personalização

1. ✅ Atualizar informações pessoais nos componentes
2. ✅ Adicionar seus próprios projetos
3. ✅ Atualizar links de redes sociais
4. ✅ Configurar email de contato
5. ✅ Adicionar imagens/logos personalizados
6. ✅ Ajustar cores do tema (opcional)
7. ✅ Configurar domínio personalizado no Vercel
8. ✅ Adicionar Google Analytics (opcional)

## 📸 Screenshots Recomendados

Para melhor apresentação dos projetos, adicione screenshots em `public/projects/`:

- sistema-financeiro.png
- ficha-treinos.png
- dontpad.png
- transacoes.png

Depois, atualize `projects-section.tsx` para incluir as imagens.
