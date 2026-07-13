# Roadmap — fabianoobispo.com.br

> Atualizado em 2026-07-12. Portfolio pessoal + ferramenta de gestão da FABIANOOBISPO DESENVOLVIMENTO E CONSULTORIA. Não é SaaS — features "produtizáveis" vivem em repos separados (zapeio, send-cloud).

## 🐛 Correções pendentes

- [x] **BI da Mega-Sena nunca tinha sido implantado no Convex de produção** — desde o commit original (`de31701`, 2026-07-12) até agora, `npx convex dev` só tinha sido rodado contra o deployment **dev** (`abundant-ant-397`); o site em produção usa um deployment **separado** (`intent-cow-40`, projeto `fabianoobispo-com-br`), que nunca recebeu schema, funções (`megaSena.*`, `megaSenaJogo.*`) nem os 3.030 concursos históricos — a página `/dashboard/megasena` quebrava com `Application error` (`[CONVEX Q(megaSena:getStats)] Server Error`, na real "Could not find function"). Corrigido: `npx convex deploy` (schema+funções), export do dev (`npx convex export`) + `npx convex import --table megaSenaResult --append --prod` pra copiar os 3.030 registros, e `SENDCLOUD_API_KEY`/`MEGASENA_ALERTA_EMAIL` recadastrados com `--prod`. Testado ao vivo em aba nova, sem erros no console. **Isso não é um bug único — é um risco estrutural**: qualquer mudança futura no `convex/` só chega em produção com `npx convex deploy` explícito; `npx convex dev`/`npx convex dev --once` (o que uso no dia a dia) só afeta o dev. Ver nota em "Lembretes operacionais".
- [x] **Login com Google quebrado em produção** — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` nunca tinham sido cadastrados nas env vars de **Production** na Vercel (só existiam no `.env` local e no deployment do Convex); o provider do Google em `src/auth/auth.config.ts` rodava com client id/secret vazios. Corrigido: `npx vercel env add GOOGLE_CLIENT_ID production` / `GOOGLE_CLIENT_SECRET production` (valores copiados do Convex dev) + redeploy (`npx vercel redeploy`). Testado end-to-end no site ao vivo: logout → clique em "Continue Com Google" → callback → `/dashboard`, duas vezes, sessão limpa. Nada foi alterado no código (por isso não há commit associado). `GITHUB_ID`/`GITHUB_SECRET` têm a mesma ausência em Production e devem estar quebrados do mesmo jeito — não corrigido ainda, ninguém reportou usar login via GitHub.
- [ ] **Rota `/dashboard/testeUpload` em produção** — página de teste de upload acessível; remover ou restringir a admin.
- [ ] **Arquivar docs de módulos removidos** — `pagamentos.md` e `RESUMO_WHATSAPP_TOOLS.md` descrevem código que não existe mais no repo; mover para `docs/archived/` (criar pasta).
- [ ] **Arquivar `handoff/`** — pacote da identidade visual `<fb/>` já foi integrado (commit `c46fb17`); manter só como referência arquivada ou deletar.
- [ ] **Limpar `npm-install.log` da raiz** — artefato de instalação commitado.
- [ ] **Login: senha vazando na URL em dev** — em `src/components/forms/user-auth-form.tsx`, uma submissão do form de login (credentials) chegou ao servidor como `GET /entrar?email=...&password=...`, expondo a senha em texto puro na URL/histórico do navegador. Suspeita: corrida entre clique e hidratação do React em dev (submit nativo do `<form>` antes do handler anexar). Investigar se acontece também em build de produção; se sim, é mais grave que um artefato de dev.
- [ ] **Tabelas órfãs no Convex** — `activityLog`, `campaign`, `cartoes`, `contacts`, `financeiro`, `messageTracking`, `payments`, `subscriptionPlans`, `subscriptions`, `whatsAppTemplate` existem no deployment mas não estão mais em `convex/schema.ts` (sobras da remoção do WhatsApp/pagamentos). Decidir: exportar/arquivar dados e apagar as tabelas, ou formalizar como "legado" documentado.

## 🔧 Melhorias técnicas

- [ ] **Atualizar NextAuth** — preso em `5.0.0-beta.18`; migrar para a release estável do v5 (atenção a breaking changes na config).
- [ ] **Atualizar Convex** — `1.17.3` vs `1.31.x` usado nos outros projetos da empresa; alinhar versões.
- [ ] **Avaliar upgrade Next.js 15 → 16 / React 18 → 19** — adicacerta e zapeio já estão em Next 16 + React 19; alinhar o stack reduz custo de manutenção entre projetos.
- [ ] **Testes automatizados** — não há nenhum teste; começar pelos módulos financeiro (cálculos de dashboard) e parser NFC-e.
- [ ] **Consolidar docs da raiz em `docs/`** — ATUALIZACOES_SEGURANCA, CHANGELOG_PORTFOLIO, MELHORIAS_FINANCAS, IMPORTACAO_JSON_GRANDES, RESUMO_ATUALIZACOES etc. poluem a raiz.

## ✨ Novas features

### Finanças (pendências de MELHORIAS_FINANCAS.md)

- [ ] **UI de categorias customizadas** — `/dashboard/financas/categorias` para criar/editar categorias além das do seed.
- [ ] **Relatórios por categoria** — export PDF/XLSX agrupado por categoria (jspdf/xlsx já estão no projeto).
- [ ] **Gráficos de gastos por categoria** — evolução mensal e comparativo entre meses.
- [ ] **Importação NFC-e → transação** — fluxo completo: escanear QR code da nota e criar despesa com produtos itemizados.

### Ficha de treino

- [ ] **Histórico e progressão de cargas** — registrar peso/reps por sessão e plotar evolução.
- [ ] **Compartilhamento de ficha** — link público read-only da ficha de treino.

### Portfolio

- [ ] **Blog/notas técnicas** — seção de artigos para SEO pessoal (o dontpad já prova o editor; falta render público com markdown).
- [ ] **Página de projetos dinâmica** — puxar repos/projetos do Convex em vez de hardcoded em `projects-section.tsx`.

### Mega-Sena BI (`/dashboard/megasena`, adicionado 2026-07-12)

- [x] Histórico completo importado (3.030 concursos, 1996–2026) para a tabela `megaSenaResult`.
- [x] Insights: frequência (quentes/frias), atraso, pares mais frequentes, distribuição de soma e par/ímpar.
- [x] Gerador de jogos sugeridos (client-side, estatístico/lúdico) e cadastro manual de concurso (fallback).
- [x] **Atualizador automático resolvido** — a API oficial da Caixa (`servicebus2.caixa.gov.br`) retorna 403 pra qualquer IP de datacenter/cloud (confirmado inclusive numa VPS própria, Contabo — só funciona de IP residencial). Trocamos a fonte em `convex/megaSena.ts:fetchLatestFromCaixa` para o espelho comunitário `loteriascaixa-api.herokuapp.com` (mesmo formato de campos: `faixa` 1/2/3 = 6/5/4 acertos, `valorAcumuladoProximoConcurso`), que **não é bloqueado nem a partir da própria Convex action** — testado rodando a action de verdade no cloud deles (`npx convex run megaSena:fetchLatestFromCaixa`). Com isso o cron nativo do Convex (`crons.ts`, diário às 19h Brasília) já resolve sozinho; nenhuma infra externa (VPS, script separado) é necessária.
- [x] **Confira sua aposta** — query `megaSena.conferirAposta` + card no dashboard: usuário digita 6 dezenas e vê acertos no último concurso + distribuição histórica de acertos.
- [x] **Próximo concurso** — `proximoConcurso`/`dataProximoConcurso`/`valorEstimadoProximoConcurso` (campos opcionais no schema) capturados no `fetchLatestFromCaixa` e exibidos num card; a action agora faz upsert (patch) no concurso mais recente em vez de só inserir, preservando `created_at` e sem deixar um campo ausente da API apagar dado já salvo.
- [x] **Jogos gerados salvos** — tabela `megaSenaJogoGerado` (`convex/megaSenaJogo.ts`); botão de salvar no gerador de jogos, lista "Meus jogos salvos" com contagem de acertos vs. último concurso.
- [x] **Alerta de acumulado alto por e-mail** — dispara via [SendCloud](https://sendcloud.dev.br) (plataforma própria, `POST /v1/emails/send`) quando a estimativa do próximo concurso cruza `MEGASENA_LIMIAR_ALERTA` (padrão R$100mi), só na transição abaixo→acima (não repete a cada corrida do cron). **Configurado e testado em produção** (`SENDCLOUD_API_KEY` e `MEGASENA_ALERTA_EMAIL` já setados no deployment do Convex via `npx convex env set`; envio real confirmado no banco do SendCloud, status `opened`). `from` é `noreply@sendcloud.dev.br` (domínio já verificado no workspace usado) — trocar exigiria cadastrar e verificar um novo domínio no SendCloud primeiro.
- [ ] **Checar `remover`/`salvar`/`listarPorUsuario` de `megaSenaJogoGerado`** — não validam que o `userId`/`jogoId` pertence ao usuário autenticado (mesmo padrão já existente em `todo.ts` e outras tabelas por-usuário do repo; não é regressão nova, mas nenhuma tabela por-usuário do projeto tem essa proteção hoje porque as Convex functions não têm a sessão do NextAuth). Corrigir exigiria integrar Convex Auth (ou equivalente) — considerar como iniciativa própria, não só pra Mega-Sena.

## 📌 Lembretes operacionais

- `npm run dev` e `npx convex dev` precisam rodar simultaneamente.
- Rodar `npm run format` (Prettier) antes de commitar.
- Seed de categorias padrão: acessar `/api/seed`.
- **Convex tem dois deployments**: dev (`abundant-ant-397`, o que `npx convex dev`/`npx convex dev --once` usa) e produção (`intent-cow-40`, o que `NEXT_PUBLIC_CONVEX_URL` na Vercel Production aponta — mesmo projeto Convex `fabianoobispo-com-br`, deployments diferentes). Mudança em `convex/` só chega no site publicado com `npx convex deploy`. Env vars também são por deployment: `npx convex env set X valor` só afeta dev, precisa `--prod` pra produção. Sempre rodar `npx convex deploy` (+ `env set ... --prod` se aplicável) depois de validar uma feature no dev, ou o site quebra silenciosamente (só dá erro em runtime, o build da Vercel passa liso).
