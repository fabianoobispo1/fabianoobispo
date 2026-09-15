'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Minus, Plus, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

interface MegaOraculoProps {
  /** Preço base de uma aposta simples de 6 dezenas (R$). Ajuste se a Caixa reajustar. */
  precoBase?: number
  /** Quantidade mínima de dezenas por jogo. */
  min?: number
  /** Quantidade máxima de dezenas por jogo. */
  max?: number
}

// --- Ingredientes esotéricos (puro teatro, ver bloco "como o oráculo calcula") ---
const DIGITOS_PI =
  '141592653589793238462643383279502884197169399375105820974944592307816406286208998628'
const DIGITOS_PHI =
  '161803398874989484820458683436563811772030917980576286213544862270526046281890244970'
const PRIMOS = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97,
]

function fibonacciMod(quantidade: number, modulo: number): number[] {
  const sequencia: number[] = []
  let a = 1
  let b = 1
  for (let i = 0; i < quantidade; i++) {
    sequencia.push(a % modulo)
    const proximo = (a + b) % modulo
    a = b
    b = proximo
  }
  return sequencia
}

const FIBONACCI = fibonacciMod(90, 60)

function xorshift(valor: number): number {
  let x = valor >>> 0
  x ^= x << 13
  x >>>= 0
  x ^= x >> 17
  x ^= x << 5
  x >>>= 0
  return x >>> 0
}

/**
 * O ritual: gera `quantidade` dezenas distintas de 1 a 60.
 *
 * A entropia de verdade vem da semente (instante do clique + Math.random).
 * π, φ, Fibonacci e primos são só o tempero cósmico — cada dezena tem
 * exatamente a mesma chance de sair no fim das contas.
 */
function invocarDezenas(quantidade: number): number[] {
  const agora = new Date()
  let semente =
    (Date.now() ^
      (agora.getSeconds() * 1000) ^
      (agora.getMilliseconds() << 7) ^
      (agora.getDate() << 3) ^
      Math.floor(Math.random() * 0xffffffff)) >>>
    0

  const escolhidas: number[] = []
  let passo = 0
  while (escolhidas.length < quantidade && passo < 200000) {
    semente = xorshift((semente + passo * 2654435761) >>> 0)
    const fonte = passo % 2 === 0 ? DIGITOS_PI : DIGITOS_PHI
    const indice = semente % (fonte.length - 1)
    const par = parseInt(fonte.slice(indice, indice + 2) || '7', 10)
    const primo = PRIMOS[passo % PRIMOS.length]
    const fib = FIBONACCI[passo % FIBONACCI.length]
    const candidata = ((par + fib + primo * 7 + (semente % 60)) % 60) + 1
    if (!escolhidas.includes(candidata)) escolhidas.push(candidata)
    passo++
  }

  return escolhidas.sort((a, b) => a - b)
}

function combinacoes(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  const kEfetivo = Math.min(k, n - k)
  let resultado = 1
  for (let i = 0; i < kEfetivo; i++) {
    resultado = (resultado * (n - i)) / (i + 1)
  }
  return Math.round(resultado)
}

const TOTAL_COMBINACOES_SENA = combinacoes(60, 6) // 50.063.860

function clamp(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function formatarDezena(dezena: number) {
  return String(dezena).padStart(2, '0')
}

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const formatadorNumero = new Intl.NumberFormat('pt-BR')

export function MegaOraculo({
  precoBase = 6,
  min = 6,
  max = 20,
}: MegaOraculoProps) {
  const [quantidade, setQuantidade] = useState(() => clamp(6, min, max))
  // Começa vazio: gerar as dezenas aqui já no render usaria Date.now()/Math.random(),
  // que produzem valores diferentes no servidor e no cliente e quebram a hydration.
  const [dezenas, setDezenas] = useState<number[]>([])
  const [copiado, setCopiado] = useState(false)

  // Primeiro sorteio só depois de montar no cliente (evita mismatch de hydration).
  useEffect(() => {
    setDezenas(invocarDezenas(clamp(6, min, max)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const combinacoesJogo = combinacoes(quantidade, 6)
  const custoAposta = combinacoesJogo * precoBase
  const chanceSena = Math.round(TOTAL_COMBINACOES_SENA / combinacoesJogo)

  const diminuir = () => setQuantidade((q) => clamp(q - 1, min, max))
  const aumentar = () => setQuantidade((q) => clamp(q + 1, min, max))

  const invocar = () => {
    setDezenas(invocarDezenas(quantidade))
    setCopiado(false)
  }

  const copiar = async () => {
    if (!dezenas.length || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(
        dezenas.map(formatarDezena).join(' - '),
      )
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1600)
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro etc.) — ignora
    }
  }

  return (
    <div className="relative w-full max-w-[540px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-[#100c24] to-[#08060f] p-6 text-indigo-100 sm:p-8">
      {/* Brilhos radiais decorativos */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative">
        {/* Marca */}
        <div className="mb-4 flex items-baseline gap-2 text-[13px] tracking-wide text-indigo-300/70">
          <span>Loterias</span>
          <b className="font-semibold text-emerald-400">Mega-Sena</b>
          <span>· 1 a 60</span>
        </div>

        <h2 className="font-sans text-[clamp(28px,7vw,40px)] font-semibold leading-[1.05] tracking-tight">
          Oráculo{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
            Cósmico
          </span>
        </h2>
        <p className="mb-7 mt-3 max-w-[44ch] text-[15.5px] text-indigo-300/70">
          Um ritual de dígitos de π, razão áurea, sequência de Fibonacci e
          peneira de primos, embaralhados por XOR — pra sortear suas dezenas com
          o máximo de pompa possível.
        </p>

        {/* Painel */}
        <section className="rounded-[20px] border border-violet-400/20 bg-gradient-to-b from-violet-950/40 to-indigo-950/25 p-5 backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="text-sm text-indigo-300/70">
              Quantas dezenas jogar?
              <small className="mt-0.5 block text-xs text-indigo-400/50">
                {quantidade === min
                  ? `Aposta mínima: ${min} dezenas`
                  : `${formatadorNumero.format(combinacoesJogo)} jogos combinados`}
              </small>
            </div>

            <div className="flex items-center gap-1 self-start rounded-full border border-violet-400/20 bg-black/20 p-1">
              <button
                type="button"
                onClick={diminuir}
                disabled={quantidade <= min}
                aria-label="Menos dezenas"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-xl leading-none transition-colors hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:text-indigo-400/40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-[40px] text-center font-sans text-xl font-semibold tabular-nums">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={aumentar}
                disabled={quantidade >= max}
                aria-label="Mais dezenas"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-xl leading-none transition-colors hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:text-indigo-400/40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={invocar}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-300 p-4 font-sans text-[16.5px] font-semibold tracking-wide text-emerald-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.5)] transition-[filter,box-shadow,transform] hover:brightness-105 hover:shadow-[0_12px_38px_-8px_rgba(16,185,129,0.6)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Invocar dezenas
          </button>

          {/* Esferas */}
          <div
            className="mt-6 flex min-h-[8px] flex-wrap justify-center gap-3"
            aria-live="polite"
          >
            {dezenas.map((dezena, i) => (
              <div
                key={`${dezena}-${i}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_34%_28%,#ffffff,#f6f4ff_55%,#d7d2ef_100%)] font-sans text-[22px] font-semibold tabular-nums text-emerald-700 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.4)_inset,0_0_22px_-6px_rgba(16,224,138,0.55)] motion-safe:animate-oracle-pop"
              >
                {formatarDezena(dezena)}
              </div>
            ))}
          </div>

          {/* Métricas */}
          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-violet-400/20 bg-violet-400/20 sm:grid-cols-2">
            <div className="bg-indigo-950/70 px-[18px] py-4">
              <div className="mb-1.5 text-xs text-indigo-400/60">
                Custo da aposta
              </div>
              <div className="font-sans text-xl font-semibold tabular-nums text-emerald-400">
                {formatadorBRL.format(custoAposta)}
              </div>
            </div>
            <div className="bg-indigo-950/70 px-[18px] py-4">
              <div className="mb-1.5 text-xs text-indigo-400/60">
                Chance da sena
              </div>
              <div className="font-sans text-xl font-semibold tabular-nums">
                1 em {formatadorNumero.format(chanceSena)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={copiar}
              disabled={!dezenas.length}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-transparent p-3 text-sm text-indigo-300/70 transition-colors hover:border-violet-400 hover:bg-violet-400/10 hover:text-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-violet-400/20 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950',
              )}
            >
              {copiado ? (
                <>
                  <Check
                    className="h-4 w-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  Copiado ✓
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar dezenas
                </>
              )}
            </button>
          </div>

          {/* Explicação honesta */}
          <details className="mt-6 border-t border-violet-400/20 pt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-violet-400 [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="text-xs">
                ✦
              </span>
              Como o oráculo realmente calcula
            </summary>
            <div className="mt-3 space-y-2.5 text-[13.5px] text-indigo-300/70">
              <p>
                Com toda honestidade: nada disso muda sua sorte. π, Fibonacci e
                os primos servem só de teatro — no fim, cada dezena de 1 a 60
                tem exatamente a mesma chance de sair, e sorteios passados não
                influenciam o próximo.
              </p>
              <p>
                A entropia de verdade vem do instante exato do clique —
                milissegundo, segundo e dia do mês do seu relógio, misturados
                por XOR (
                <code className="font-mono text-emerald-400">
                  Date.now() ⊕ …
                </code>
                ) e passados por um{' '}
                <code className="font-mono text-emerald-400">xorshift</code>. É
                o universo alinhando neste instante. O resto é enfeite bonito.
                Jogue com o que não faz falta. 🍀
              </p>
            </div>
          </details>
        </section>
      </div>
    </div>
  )
}
