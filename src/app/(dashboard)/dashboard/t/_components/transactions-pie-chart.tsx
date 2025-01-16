'use client'

import { PiggyBankIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Pie, PieChart } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent } from '@/components/ui/card'

import { PercentageItem } from './percentage-item'

const chartConfig = {
  INVESTMENT: {
    label: 'Investido',
    color: '#FFFFFF',
  },
  DEPOSIT: {
    label: 'Receita',
    color: '#55B02E',
  },
  EXPENSE: {
    label: 'Despesa',
    color: '#E93030',
  },
} satisfies ChartConfig

interface TransactionsPieChartProps {
  investmentsTotal: number
  depositsTotal: number
  expensesTotal: number
}

export const TransactionsPieChart = ({
  depositsTotal,
  expensesTotal,
  investmentsTotal,
}: TransactionsPieChartProps) => {
  const chartData = [
    { type: 'DEPOSIT', amount: depositsTotal, fill: '#55B02E' },
    { type: 'EXPENSE', amount: expensesTotal, fill: '#E93030' },
    {
      type: 'INVESTMENT',
      amount: investmentsTotal,
      fill: '#FFFFFF',
    },
  ]

  return (
    <Card className="flex flex-col p-6">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="type"
              innerRadius={55}
            />
          </PieChart>
        </ChartContainer>

        <div className="space-y-4">
          <PercentageItem
            icon={<TrendingUpIcon size={16} className="text-primary" />}
            title="Receita"
            value={'DEPOSIT'}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-red-500" />}
            title="Despesas"
            value={'EXPENSE'}
          />
          <PercentageItem
            icon={<PiggyBankIcon size={16} />}
            title="Investido"
            value={'INVESTMENT'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
