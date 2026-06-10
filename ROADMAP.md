# Roadmap — fabianoobispo.com.br

> Atualizado em 2026-06-10. Portfolio pessoal + ferramenta de gestão da FABIANOOBISPO DESENVOLVIMENTO E CONSULTORIA. Não é SaaS — features "produtizáveis" vivem em repos separados (zapeio, send-cloud).

## 🐛 Correções pendentes

- [ ] **Rota `/dashboard/testeUpload` em produção** — página de teste de upload acessível; remover ou restringir a admin.
- [ ] **Arquivar docs de módulos removidos** — `pagamentos.md` e `RESUMO_WHATSAPP_TOOLS.md` descrevem código que não existe mais no repo; mover para `docs/archived/` (criar pasta).
- [ ] **Arquivar `handoff/`** — pacote da identidade visual `<fb/>` já foi integrado (commit `c46fb17`); manter só como referência arquivada ou deletar.
- [ ] **Limpar `npm-install.log` da raiz** — artefato de instalação commitado.

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

## 📌 Lembretes operacionais

- `npm run dev` e `npx convex dev` precisam rodar simultaneamente.
- Rodar `npm run format` (Prettier) antes de commitar.
- Seed de categorias padrão: acessar `/api/seed`.
