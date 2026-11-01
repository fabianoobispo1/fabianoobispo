# Terminal web — guia rápido

Terminal SSH em `/dashboard/terminal`, com sessões tmux persistentes,
várias janelas no desktop e modo celular. Só o e-mail em
`TERMINAL_AUTHORIZED_EMAIL` acessa.

Instalação, variáveis, TLS e diagnóstico:
[`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md).

## Checklist de instalação

1. `node scripts/gen-terminal-keys.mjs` → pública na Vercel
   (`NEXT_PUBLIC_TERMINAL_PUBLIC_KEY`), privada no `.env` do VPS
   (`TERMINAL_PRIVATE_KEY`).
2. `bash scripts/deploy-terminal-docker.sh usuario@vps` e preencha
   `ALLOWED_ORIGINS`, `TERMINAL_AUTHORIZED_EMAIL`, `TERMINAL_PRIVATE_KEY`
   no `/opt/terminal-server/.env`; rode o script de novo.
3. Proxy com TLS (Caddy/Nginx) → `TERMINAL_VPS_WS_URL=wss://...` e o mesmo
   `TERMINAL_TOKEN_SECRET` na Vercel.
4. `TERMINAL_AUTHORIZED_EMAIL` na Vercel **e** no Convex
   (`npx convex env set TERMINAL_AUTHORIZED_EMAIL ... --prod`).
5. `apt install tmux` no host de destino.

## Uso

**Conexões** (aba "Conexões"): host, porta, usuário e senha ou chave
privada. A credencial é selada no navegador e nunca volta para a tela;
para trocar host/porta/usuário é preciso digitá-la de novo. O 🔒 mostra a
host key fixada na 1ª conexão.

**Sessões**: cada janela é uma sessão tmux `agent-N` no host. Fechar a
janela (✕) ou a aba **não** encerra nada; o ⏻ encerra a sessão (com
confirmação). Apelido, cor e pasta ficam salvos na sua conta.

### Desktop

| Ação | Como |
|---|---|
| Paleta de comandos | **Ctrl+Shift+K** ou **⌘K** |
| Ir para a sessão N | **Ctrl+Shift+1…9** |
| Mover / encaixar | arraste a barra de título até uma borda (metade), canto (quarto) ou topo (maximizar) |
| Redimensionar | bordas e cantos da janela |
| Maximizar | duplo clique na barra de título |
| Organizar | botões "lado a lado" e "cascata" no dock |
| Preview | passe o mouse sobre o chip da sessão no dock |
| Copiar | selecione o texto (copia sozinho) |
| Colar | **Ctrl+V** ou clique direito |
| Interromper | **Ctrl+C** (sempre vai para o host, nunca copia) |

**Ctrl+K** não é capturado (vai para o shell). O layout das janelas fica
salvo no navegador, por conexão.

### Celular (< 768px)

- Uma sessão por vez em tela cheia; troque pelo dock.
- Barra acima do teclado: esc, tab, ⇧tab, **ctrl** (vale para a próxima
  tecla), setas, ^C, ^D e colar.
- Arraste o dedo para rolar o histórico (modo de cópia do tmux; esc sai).
- Toque longo ou 📋 abre um campo para colar texto; "copiar" mostra todo o
  histórico da sessão como texto.
