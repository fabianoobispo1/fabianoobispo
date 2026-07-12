'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface DistribuicaoChartsProps {
  somaHistograma: { faixa: string; quantidade: number }[]
  paridade: { pares: number; quantidade: number }[]
}

const somaConfig = {
  quantidade: { label: 'Concursos', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const paridadeConfig = {
  quantidade: { label: 'Concursos', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

export const DistribuicaoCharts = ({
  somaHistograma,
  paridade,
}: DistribuicaoChartsProps) => {
  const paridadeData = paridade.map((item) => ({
    ...item,
    label: `${item.pares} pares`,
  }))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Soma das dezenas por concurso</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={somaConfig} className="h-[260px] w-full">
            <BarChart data={somaHistograma}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="faixa"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="quantidade"
                fill="var(--color-quantidade)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantidade de números pares por concurso</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={paridadeConfig} className="h-[260px] w-full">
            <BarChart data={paridadeData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="quantidade"
                fill="var(--color-quantidade)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
