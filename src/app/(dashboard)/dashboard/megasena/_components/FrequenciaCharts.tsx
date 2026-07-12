'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface FrequenciaItem {
  dezena: number
  quantidade: number
}

interface FrequenciaChartsProps {
  frequencia: FrequenciaItem[]
}

const quentesConfig = {
  quantidade: { label: 'Vezes sorteada', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const friosConfig = {
  quantidade: { label: 'Vezes sorteada', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

const formatDezena = (value: number | string) => String(value).padStart(2, '0')

export const FrequenciaCharts = ({ frequencia }: FrequenciaChartsProps) => {
  const quentes = frequencia.slice(0, 10)
  const frios = [...frequencia]
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, 10)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dezenas mais sorteadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={quentesConfig} className="h-[280px] w-full">
            <BarChart data={quentes} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="dezena"
                type="category"
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={formatDezena}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="quantidade"
                fill="var(--color-quantidade)"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dezenas menos sorteadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={friosConfig} className="h-[280px] w-full">
            <BarChart data={frios} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="dezena"
                type="category"
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={formatDezena}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="quantidade"
                fill="var(--color-quantidade)"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
