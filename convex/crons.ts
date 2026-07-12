import { cronJobs } from 'convex/server'

import { api } from './_generated/api'

const crons = cronJobs()

// Sorteios da Mega-Sena saem terça, quinta e sábado à noite; roda todo dia
// à tarde (horário de Brasília, UTC-3) pra garantir que pegue o resultado
// assim que a Caixa publica. bulkImport ignora concurso já existente, então
// rodar em dias sem sorteio não tem efeito.
crons.daily(
  'verifica novo resultado da mega-sena',
  { hourUTC: 22, minuteUTC: 0 },
  api.megaSena.fetchLatestFromCaixa,
)

export default crons
