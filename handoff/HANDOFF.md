# Handoff · Marca `<fb/>` para fabianoobispo.com.br

> **Para o Claude Code:** este pacote contém a nova identidade visual do site fabianoobispo.com.br. Sua tarefa é integrar a marca no codebase Next.js 15 existente, sem quebrar nada. Siga os passos na ordem. Se algo no projeto já existir, **mescle**, não substitua.

---

## TL;DR — o que mudar

1. Adicionar uma marca tipográfica `<fb/>` em todo o site (header, footer, OG, favicon).
2. Mudar a paleta para **floresta profundo + esmeralda** (`#0a1611`, `#10b981`, `#f4f1ea`).
3. Fontes: **JetBrains Mono** (mono) + **Space Grotesk** (sans).
4. Trocar favicon, apple-icon e OG image pelos arquivos do app router (`app/icon.tsx` etc.).

---

## Stack alvo (confirmado)

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- next/font (Google Fonts via auto-self-hosting)

---

## Estrutura do pacote

```
handoff/
├── app/
│   ├── layout.tsx              ← trecho de fontes + metadata (mesclar com seu atual)
│   ├── icon.tsx                ← favicon 32x32 (Next 15 app router)
│   ├── apple-icon.tsx          ← apple touch icon 180x180
│   └── opengraph-image.tsx     ← OG image 1200x630
├── components/
│   ├── brand/
│   │   ├── tokens.ts           ← cores, fontes, copy como constantes
│   │   └── logo.tsx            ← <Logo>, <LogoIcon>, <LogoWordmark>, <LogoLockup>
│   ├── site-header.tsx         ← header de exemplo usando a marca
│   └── site-footer.tsx         ← footer de exemplo usando a marca
└── tailwind.brand.ts           ← extensão de cores/fonts/animations p/ mesclar
```

---

## Passos de integração (executar em ordem)

### 1. Copiar componentes da marca

```bash
mkdir -p components/brand
cp handoff/components/brand/tokens.ts  components/brand/tokens.ts
cp handoff/components/brand/logo.tsx   components/brand/logo.tsx
```

> O componente `logo.tsx` usa `@/lib/utils` (`cn` do shadcn). Já existe no projeto.

### 2. Mesclar `tailwind.config.ts`

Abrir `tailwind.config.ts` atual e **adicionar** ao bloco `theme.extend`:

```ts
colors: {
  brand: {
    forest:       "#0a1611",
    "forest-2":   "#0f1f17",
    "forest-3":   "#132a20",
    emerald:      "#10b981",
    "emerald-hi": "#34d399",
    cream:        "#f4f1ea",
    mute:         "#7a8a83",
  },
  // ... cores existentes
},
fontFamily: {
  mono: ["var(--font-mono)", "ui-monospace", "monospace"],
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
},
keyframes: {
  "brand-blink": {
    "0%, 49%":   { opacity: "1" },
    "50%, 100%": { opacity: "0" },
  },
},
animation: {
  "brand-blink": "brand-blink 1.05s steps(1) infinite",
},
```

> **Não remova** o `colors` do shadcn (`background`, `primary`, etc.). Só adicione o objeto `brand`.

### 3. Atualizar `app/layout.tsx` — fontes e metadata

No `app/layout.tsx` atual:

- Trocar (ou adicionar) os imports de fonte para **JetBrains_Mono** + **Space_Grotesk**.
- Atribuir as variáveis CSS no `<html className={`${fontMono.variable} ${fontSans.variable}`}>`.
- Atualizar o `<body className="bg-brand-forest text-brand-cream font-sans">`.
- Atualizar o `metadata` (ver `handoff/app/layout.tsx` como referência).

### 4. Substituir favicon, apple-icon e OG

```bash
cp handoff/app/icon.tsx              app/icon.tsx
cp handoff/app/apple-icon.tsx        app/apple-icon.tsx
cp handoff/app/opengraph-image.tsx   app/opengraph-image.tsx

# remover arquivos legados se existirem
rm -f public/favicon.ico app/favicon.ico
rm -f public/apple-touch-icon.png
```

O Next.js 15 detecta `app/icon.tsx` automaticamente e gera as URLs corretas no `<head>`.

### 5. Migrar header + footer

O header e footer de exemplo (`handoff/components/site-header.tsx`, `site-footer.tsx`) mostram **como usar** a marca. Adapte para o seu header/footer atuais:

- Substituir o ponto onde aparece "FB" ou o nome por `<Logo />`.
- Aplicar as classes `bg-brand-forest`, `text-brand-cream`, `text-brand-emerald` no lugar das cores hardcoded antigas.
- Adicionar o "● DISPONÍVEL P/ PROJETOS" como microcopy no header ou hero, em `font-mono text-brand-emerald`.

### 6. Atualizar a paleta global do site

Onde estiverem cores como `#000`, `#1a1a1a`, verde genérico, azul, etc., **substituir pela paleta da marca**:

| antes (genérico)       | depois (marca)          |
| ---------------------- | ----------------------- |
| bg preto/escuro        | `bg-brand-forest`       |
| bg de cards / surfaces | `bg-brand-forest-2`     |
| bordas / dividers      | `border-brand-forest-3` |
| accent (link/botão)    | `text-brand-emerald`    |
| accent hover           | `text-brand-emerald-hi` |
| texto principal claro  | `text-brand-cream`      |
| texto secundário       | `text-brand-mute`       |

### 7. Microcopy & detalhes

- **Hero**: substituir "Olá, sou Fabiano Bispo" por algo mais direto e tech. Sugestão: a marca `<fb/>` grande, abaixo `Desenvolvedor Full Stack.` em `font-sans font-semibold`, e a tagline `Construindo software que entrega.` Manter o texto longo atual como sub-tagline.
- **Badges de stack** (React, Next.js, TypeScript...): converter para chips `font-mono text-xs` com borda `border-brand-forest-3` e texto `text-brand-cream/80`.
- **Botões CTA**: estilo "terminal button" — `border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald hover:text-brand-forest font-mono tracking-wider uppercase text-xs`.
- **Cursor piscando**: opcional, na tagline do hero, adicionar `<span className="inline-block w-[0.5ch] h-[0.9em] bg-brand-emerald animate-brand-blink align-middle ml-1" />`.

---

## Regras de uso da marca

### ✅ FAZER

- Sempre usar o componente `<Logo>` — nunca recriar o `<fb/>` em outro lugar.
- Manter `clear-space` mínimo ao redor da marca = altura do glifo `b`.
- Usar `variant="icon"` em headers fixos / espaços compactos.
- Usar `variant="lockup"` em hero, footer, login.
- Em fundos claros, sempre passar `theme="light"`.

### ❌ NÃO FAZER

- Não usar a marca em cores fora da paleta (sem roxo, azul, vermelho).
- Não esticar, rotacionar ou aplicar drop-shadow.
- Não trocar a fonte do `<fb/>` por outra mono. JetBrains Mono é parte da identidade.
- Não colocar o `<fb/>` sobre imagens com alto contraste sem um quadrado de fundo `bg-brand-forest`.

---

## Tokens (referência rápida)

```ts
// cores
forestDeep  #0a1611   ← bg principal
forest      #0f1f17   ← bg cards / surfaces
forestSoft  #132a20   ← bordas / dividers
emerald     #10b981   ← accent primário
emeraldHi   #34d399   ← accent hover
cream       #f4f1ea   ← ink sobre escuro
mute        #7a8a83   ← texto secundário

// tipografia
mono → "JetBrains Mono"
sans → "Space Grotesk"
```

---

## Smoke test após integração

1. `pnpm dev` (ou `npm run dev`) sobe sem erros.
2. Abrir `/` — header tem `<fb/>` em verde + "fabianoobispo" em creme.
3. Abrir devtools → Network → checar que `/icon` e `/apple-icon` retornam PNG.
4. Compartilhar `localhost:3000` no WhatsApp Web → preview mostra a OG image nova.
5. Aba do browser tem o favicon verde com `fb`.
6. Lighthouse contrast ratio: passar em AA (a paleta foi escolhida para isso).

---

## Próximos passos opcionais (não fazer agora)

- Aplicar a marca nos dashboards internos (`/dashboard/*`).
- Criar página `/marca` no site mostrando o brand kit publicamente.
- Versão animada do `<fb/>` no hero (cursor piscando real, transição entre `<fb/>` ↔ `<fb |>` etc.).
- Cartões de visita impressos (arquivo SVG em `exports/` já está pronto).

---

**Dúvidas?** Falar com o designer (este chat). Não inventar variações da marca; pedir.
