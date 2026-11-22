'use client'

import { api } from '@/../convex/_generated/api'

import { useMemo, useState } from 'react'
import {
  useAction,
  useConvexAuth,
  usePaginatedQuery,
  useQuery,
} from 'convex/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { fixMojibake, formatPhoneBR } from './fix-text'

type Stats = {
  total: number
  withMessage: number
  withName: number
  emptyName: number
  mojibake: number
  invalidNumber: number
  foreign: number
  mobile: number
  landline: number
  withDate: number
  duplicateNumbers: number
  duplicateRows: number
  firstMsg: number | null
  lastMsg: number | null
  active: { d7: number; d30: number; d90: number; d365: number }
  byDDD: { ddd: string; uf: string; count: number }[]
  byUF: { uf: string; count: number }[]
  byMonth: { month: string; count: number }[]
  byDay: { day: string; count: number }[]
  byCreatedDay: { day: string; count: number }[]
  heat: number[][]
  lenBuckets: { bucket: string; count: number }[]
  topWords: { word: string; count: number }[]
}

const nf = new Intl.NumberFormat('pt-BR')
const fmtN = (n: number) => nf.format(n)
const pct = (n: number, total: number) =>
  total ? `${((n / total) * 100).toFixed(1).replace('.', ',')}%` : '—'
const fmtDate = (t: number | null) =>
  t == null
    ? '—'
    : new Date(t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

const countConfig = {
  count: { label: 'Contatos', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig
const count2Config = {
  count: { label: 'Contatos', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig
const wordConfig = {
  count: { label: 'Mensagens', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ContatosDashboard() {
  const { isAuthenticated } = useConvexAuth()
  const snapshot = useQuery(
    api.contacts.getStats,
    isAuthenticated ? {} : 'skip',
  )
  const refresh = useAction(api.contacts.refreshStats)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const r = await refresh({})
      toast.success(
        `Estatísticas recalculadas: ${fmtN(r.total)} contatos em ${(r.durationMs / 1000).toFixed(1)}s`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao recalcular')
    } finally {
      setRefreshing(false)
    }
  }

  const stats = snapshot?.data as Stats | undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {snapshot === undefined
            ? 'Carregando…'
            : snapshot
              ? `Snapshot de ${fmtDate(snapshot.computedAt)} (${(snapshot.durationMs / 1000).toFixed(1)}s). Os gráficos não leem a tabela ao vivo: clique em Recalcular para atualizar.`
              : 'Nenhuma estatística calculada ainda.'}
        </p>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Recalculando…' : 'Recalcular'}
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="geral">Visão geral</TabsTrigger>
            <TabsTrigger value="geo">Geografia</TabsTrigger>
            <TabsTrigger value="atividade">Atividade</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
            <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
          </TabsList>
        </div>

        {(['geral', 'geo', 'atividade', 'mensagens', 'qualidade'] as const).map(
          (tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {snapshot === undefined ? (
                <Skeleton className="h-64 w-full" />
              ) : !stats ? (
                <EmptyState onRefresh={handleRefresh} refreshing={refreshing} />
              ) : tab === 'geral' ? (
                <VisaoGeral s={stats} />
              ) : tab === 'geo' ? (
                <Geografia s={stats} />
              ) : tab === 'atividade' ? (
                <Atividade s={stats} />
              ) : tab === 'mensagens' ? (
                <Mensagens s={stats} />
              ) : (
                <Qualidade s={stats} />
              )}
            </TabsContent>
          ),
        )}

        <TabsContent value="tabela">
          <TabelaContatos enabled={isAuthenticated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void
  refreshing: boolean
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Ainda não há estatísticas. O cálculo varre a tabela inteira uma vez e
          guarda o resultado.
        </p>
        <Button onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Calculando…' : 'Calcular agora'}
        </Button>
      </CardContent>
    </Card>
  )
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {hint}
        </CardContent>
      )}
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------- abas

function VisaoGeral({ s }: { s: Stats }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total de contatos" value={fmtN(s.total)} />
        <Kpi
          label="Com última mensagem"
          value={fmtN(s.withMessage)}
          hint={pct(s.withMessage, s.total)}
        />
        <Kpi
          label="Estados (UF)"
          value={fmtN(s.byUF.filter((u) => u.uf !== '??').length)}
          hint={`${fmtN(s.byDDD.length)} DDDs`}
        />
        <Kpi
          label="Celulares"
          value={fmtN(s.mobile)}
          hint={`${fmtN(s.landline)} fixos`}
        />
        <Kpi label="Ativos em 7 dias" value={fmtN(s.active.d7)} />
        <Kpi label="Ativos em 30 dias" value={fmtN(s.active.d30)} />
        <Kpi label="Ativos em 90 dias" value={fmtN(s.active.d90)} />
        <Kpi label="Ativos em 12 meses" value={fmtN(s.active.d365)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Mensagens por mês"
          description="Pela data da última mensagem"
        >
          <MonthChart data={s.byMonth} />
        </ChartCard>
        <ChartCard title="Top 10 estados">
          <HBar data={s.byUF.slice(0, 10)} dataKey="uf" config={count2Config} />
        </ChartCard>
      </div>
      <p className="text-xs text-muted-foreground">
        Primeira mensagem: {fmtDate(s.firstMsg)} · Última mensagem:{' '}
        {fmtDate(s.lastMsg)}
      </p>
    </>
  )
}

function Geografia({ s }: { s: Stats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Contatos por estado">
        <HBar data={s.byUF} dataKey="uf" config={count2Config} />
      </ChartCard>
      <ChartCard title="Top 25 DDDs">
        <HBar
          data={s.byDDD.slice(0, 25).map((d) => ({
            label: `${d.ddd} · ${d.uf}`,
            count: d.count,
          }))}
          dataKey="label"
          config={countConfig}
          width={64}
        />
      </ChartCard>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Todos os DDDs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {s.byDDD.map((d) => (
            <span
              key={d.ddd}
              className="rounded-md border px-2 py-1 text-xs tabular-nums"
            >
              <b>{d.ddd}</b> {d.uf} · {fmtN(d.count)} ({pct(d.count, s.total)})
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Atividade({ s }: { s: Stats }) {
  const [range, setRange] = useState<30 | 90 | 365 | 0>(90)
  const allDays = useMemo(() => fillDays(s.byDay), [s.byDay])
  const days = range ? allDays.slice(-range) : allDays
  const lastDay = allDays.at(-1)?.day
  const max = Math.max(1, ...s.heat.flat())

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Contatos por dia da última mensagem"
        description={`Horário de Brasília · períodos contados até a mensagem mais recente${lastDay ? ` (${fmtDay(lastDay)})` : ''}`}
      >
        <div className="mb-3 flex gap-1">
          {([30, 90, 365, 0] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? 'default' : 'outline'}
              onClick={() => setRange(r)}
            >
              {r ? `${r} dias` : 'Tudo'}
            </Button>
          ))}
        </div>
        <ChartContainer config={countConfig} className="h-[260px] w-full">
          <AreaChart data={days}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tickFormatter={(d: string) =>
                `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}`
              }
            />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, p) =>
                    fmtDay(String(p?.[0]?.payload?.day ?? ''))
                  }
                />
              }
            />
            <Area
              dataKey="count"
              type="linear"
              fill="var(--color-count)"
              fillOpacity={0.25}
              stroke="var(--color-count)"
            />
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Mapa de calor: dia da semana × hora"
        description="Quando chegou a última mensagem de cada contato (Brasília)"
      >
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[640px] gap-[2px] text-[10px]"
            style={{ gridTemplateColumns: '36px repeat(24, minmax(0, 1fr))' }}
          >
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center text-muted-foreground">
                {h}
              </div>
            ))}
            {s.heat.map((row, d) => (
              <HeatRow key={d} label={WEEKDAYS[d]} row={row} max={max} />
            ))}
          </div>
        </div>
      </ChartCard>

      {s.byCreatedDay.length > 0 && (
        <ChartCard
          title="Importações (createdAt)"
          description="Quando os registros foram criados na tabela"
        >
          <HBar
            data={s.byCreatedDay
              .slice(-15)
              .map((d) => ({ label: d.day, count: d.count }))}
            dataKey="label"
            config={count2Config}
            width={84}
          />
        </ChartCard>
      )}
    </div>
  )
}

const fmtDay = (d: string) =>
  d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : ''

/** Preenche com 0 os dias sem mensagem, para o eixo ser continuo. */
function fillDays(byDay: { day: string; count: number }[]) {
  if (!byDay.length) return []
  const map = new Map(byDay.map((d) => [d.day, d.count]))
  const out: { day: string; count: number }[] = []
  const end = Date.parse(`${byDay[byDay.length - 1].day}T00:00:00Z`)
  for (let t = Date.parse(`${byDay[0].day}T00:00:00Z`); t <= end; t += 864e5) {
    const day = new Date(t).toISOString().slice(0, 10)
    out.push({ day, count: map.get(day) ?? 0 })
  }
  return out
}

function HeatRow({
  label,
  row,
  max,
}: {
  label: string
  row: number[]
  max: number
}) {
  return (
    <>
      <div className="flex items-center text-muted-foreground">{label}</div>
      {row.map((v, h) => (
        <div
          key={h}
          title={`${label} ${h}h: ${fmtN(v)}`}
          className="aspect-square rounded-sm"
          style={{
            // escala raiz quadrada: um pico isolado nao apaga o resto do mapa
            background: `hsl(var(--chart-1) / ${v ? 0.15 + 0.85 * Math.sqrt(v / max) : 0.04})`,
          }}
        />
      ))}
    </>
  )
}

function Mensagens({ s }: { s: Stats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Palavras mais frequentes"
        description="Na última mensagem de cada contato (sem stopwords)"
      >
        <HBar
          data={s.topWords.slice(0, 25).map((w) => ({
            label: w.word,
            count: w.count,
          }))}
          dataKey="label"
          config={wordConfig}
          width={96}
        />
      </ChartCard>
      <ChartCard title="Tamanho da última mensagem" description="Em caracteres">
        <ChartContainer config={countConfig} className="h-[260px] w-full">
          <BarChart data={s.lenBuckets}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

function Qualidade({ s }: { s: Stats }) {
  const items: { label: string; value: number; hint: string }[] = [
    {
      label: 'Números duplicados',
      value: s.duplicateNumbers,
      hint: `${fmtN(s.duplicateRows)} registros a mais`,
    },
    { label: 'Sem nome', value: s.emptyName, hint: 'name vazio' },
    {
      label: 'Encoding quebrado',
      value: s.mojibake,
      hint: 'ex.: "CristÃ³vÃ£o" no nome ou mensagem',
    },
    {
      label: 'Número inválido',
      value: s.invalidNumber,
      hint: 'começa com 55 mas não tem 12–13 dígitos',
    },
    { label: 'Fora do Brasil', value: s.foreign, hint: 'não começa com 55' },
    {
      label: 'Sem data de mensagem',
      value: s.total - s.withDate,
      hint: 'lastMessageAt vazio/ilegível',
    },
    {
      label: 'DDD desconhecido',
      value: s.byUF.find((u) => u.uf === '??')?.count ?? 0,
      hint: 'DDD fora da tabela da Anatel',
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((i) => (
        <Kpi
          key={i.label}
          label={i.label}
          value={fmtN(i.value)}
          hint={`${pct(i.value, s.total)} · ${i.hint}`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- tabela

function TabelaContatos({ enabled }: { enabled: boolean }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.contacts.listPage,
    enabled ? {} : 'skip',
    { initialNumItems: 100 },
  )
  const [filter, setFilter] = useState('')

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const fDigits = f.replace(/\D/g, '')
    return results
      .map((r) => ({
        ...r,
        name: fixMojibake(r.name),
        lastMessageText: fixMojibake(r.lastMessageText),
      }))
      .filter(
        (r) =>
          !f ||
          r.name.toLowerCase().includes(f) ||
          r.lastMessageText.toLowerCase().includes(f) ||
          (fDigits && r.number.includes(fDigits)),
      )
  }, [results, filter])

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Contatos</CardTitle>
        <CardDescription>
          {fmtN(results.length)} carregados. O filtro busca só entre os
          carregados (a tabela não tem índice de busca).
        </CardDescription>
        <Input
          placeholder="Filtrar por nome, número ou mensagem…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Última mensagem</TableHead>
                <TableHead className="whitespace-nowrap">Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="max-w-[200px] truncate">
                    {r.name || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatPhoneBR(r.number)}
                  </TableCell>
                  <TableCell
                    className="max-w-[360px] truncate"
                    title={r.lastMessageText}
                  >
                    {r.lastMessageText || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums">
                    {fmtDate(r.lastMessageAt)}
                  </TableCell>
                </TableRow>
              ))}
              {status === 'LoadingFirstPage' && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            disabled={status !== 'CanLoadMore'}
            onClick={() => loadMore(500)}
          >
            {status === 'LoadingMore'
              ? 'Carregando…'
              : status === 'Exhausted'
                ? 'Fim da tabela'
                : 'Carregar mais 500'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------- charts

function MonthChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ChartContainer config={countConfig} className="h-[280px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickFormatter={(m: string) => `${m.slice(5, 7)}/${m.slice(2, 4)}`}
        />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

function HBar<T extends { count: number }>({
  data,
  dataKey,
  config,
  width = 36,
}: {
  data: T[]
  dataKey: keyof T & string
  config: ChartConfig
  width?: number
}) {
  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: Math.max(160, data.length * 26) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey={dataKey}
          type="category"
          tickLine={false}
          axisLine={false}
          width={width}
          interval={0}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
