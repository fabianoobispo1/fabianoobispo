'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const chartConfig = {
  kwhGenerated: {
    label: 'Geração (kWh)',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

interface GenerationChartProps {
  generations: { date: number; kwhGenerated: number }[]
}

export function GenerationChart({ generations }: GenerationChartProps) {
  const data = [...generations]
    .sort((a, b) => a.date - b.date)
    .map((g) => ({
      dateLabel: new Date(g.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      kwhGenerated: g.kwhGenerated,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Geração de energia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum registro de geração ainda.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="kwhGenerated"
                fill="var(--color-kwhGenerated)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
