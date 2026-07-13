# Roadmap — fabianoobispo.com.br

> Atualizado em 2026-07-12. Portfolio pessoal + ferramenta de gestão da FABIANOOBISPO DESENVOLVIMENTO E CONSULTORIA. Não é SaaS — features "produtizáveis" vivem em repos separados (zapeio, send-cloud).

## 🐛 Correções pendentes

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

## 📌 Lembretes operacionais

- `npm run dev` e `npx convex dev` precisam rodar simultaneamente.
- Rodar `npm run format` (Prettier) antes de commitar.
- Seed de categorias padrão: acessar `/api/seed`.
