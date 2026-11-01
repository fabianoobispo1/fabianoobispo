# Terminal web — modelo de segurança

O terminal dá shell em servidores reais, então cada camada assume que a
anterior pode falhar. Instalação: [`docs/TERMINAL_VPS_INSTALL.md`](docs/TERMINAL_VPS_INSTALL.md).
Uso: [`TERMINAL_QUICK_START.md`](TERMINAL_QUICK_START.md).

## Quem pode usar

| Camada | Verificação |
|---|---|
| Página `/dashboard/terminal` | sessão NextAuth com o e-mail `TERMINAL_AUTHORIZED_EMAIL` (sem a variável, a página redireciona) |
| `/api/terminal/token` | mesma checagem (comparação sem diferenciar maiúsculas); sem e-mail configurado → 503 |
| Convex (`sshConnection`, `terminalSession`) | identidade do JWT (`requireTerminalUser`); o `userId` nunca vem do cliente, e cada registro é conferido contra o dono |
| Terminal Server | token HMAC válido, não expirado, **de uso único** (`jti`), validade ≤ 2 min, e o e-mail do token igual a `TERMINAL_AUTHORIZED_EMAIL` do container |

## Credenciais SSH

- O navegador sela `{v, owner, host, port, username, authMethod, senha|chave,
  passphrase}` com a **chave pública** do Terminal Server
  (`crypto_box_seal`). O Convex guarda só o ciphertext (`sealedCredential`).
- Nem o Convex nem o Next.js conseguem abrir; a UI nunca recebe a
  credencial de volta (`hasCredential` diz só se existe).
- O Terminal Server conecta no host **de dentro** do blob e exige
  `owner == sub` do token: o ciphertext não serve para outro destino nem
  para outro usuário.
- Mudar host/porta/usuário/método exige digitar a credencial de novo; a
  mutation recusa a troca sem um novo blob.
- Campos antigos em texto puro (`password`, `privateKey`,
  `privateKeyPassphrase`) não são mais lidos nem gravados. A limpeza é
  `npx convex run sshConnection:purgePlaintextSecretsInternal` (`--prod`
  em produção).

## Host de destino

- **Host key fixada (TOFU):** a fingerprint SHA256 vista na 1ª conexão é
  gravada (`pinHostKey`); uma chave diferente depois é recusada pelo
  Terminal Server. Trocar só por ação explícita ("Confiar na nova chave"),
  e trocar host/porta limpa a fixação.
- `ALLOWED_SSH_HOSTS` (opcional) restringe os destinos no próprio container.

## Comandos no host

- Nomes de sessão: só `^agent-\d{1,6}$`. Pasta: `~`, `~/…` ou `/…` com
  letras, números, espaço e `._-/`.
- Tudo que vem do navegador é validado **e** vai entre aspas simples
  (`lib/tmux.js`); alvos tmux usam `=nome` (casamento exato).
- Socket tmux dedicado (`tmux -L webdeck`).

## Transporte e limites

- `Origin` do upgrade validado contra `ALLOWED_ORIGINS` (403); o token vai
  na 1ª mensagem, nunca na URL (que acabaria em logs de proxy).
- TLS obrigatório em produção (no container ou no proxy).
- Limites: conexões globais e por usuário, terminais por conexão, tamanho
  de mensagem, colunas/linhas, saída de comandos de controle (2 MB) e
  backpressure quando o navegador não consome a saída.
- Container sem root, sistema de arquivos read-only, sem capabilities,
  porta só em 127.0.0.1 atrás do proxy.

## Auditoria

Logs JSON no stdout do container (`docker logs terminal-server`): quem
conectou, de qual IP, em qual destino, por quanto tempo, sessões
criadas/encerradas e toda recusa (origin, token, e-mail, host key). Teclas
e credenciais **não** são registradas.

## Fora do escopo / riscos aceitos

- Quem tem a `TERMINAL_PRIVATE_KEY` (o VPS) abre todas as credenciais
  salvas. Proteja o `.env` (`chmod 600`) e o acesso root do VPS.
- Uma sessão NextAuth roubada do e-mail autorizado dá acesso ao terminal.
  Use 2FA na conta Google/GitHub.
- O TOFU não protege a **primeira** conexão; confira a fingerprint com
  `ssh-keygen -lf` quando ela for registrada.
