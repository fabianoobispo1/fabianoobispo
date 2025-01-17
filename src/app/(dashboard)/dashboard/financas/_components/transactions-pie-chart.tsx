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
import { TransactionTypeLabels } from '@/types'

import { PercentageItem } from './percentage-item'

const chartConfig = {
  INVESTMENT: {
    label: TransactionTypeLabels.INVESTMENT,
    color: '#FFFFFF',
  },
  DEPOSIT: {
    label: TransactionTypeLabels.DEPOSIT,
    color: '#55B02E',
  },
  EXPENSE: {
    label: TransactionTypeLabels.EXPENSE,
    color: '#E93030',
  },
} satisfies ChartConfig

interface TransactionsPieChartProps {
  typesPercentage: {
    DEPOSIT: number
    EXPENSE: number
    INVESTMENT: number
  }
  investmentsTotal: number
  depositsTotal: number
  expensesTotal: number
}

export const TransactionsPieChart = ({
  typesPercentage,
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
            title={TransactionTypeLabels.DEPOSIT}
            value={typesPercentage.DEPOSIT}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-red-500" />}
            title={TransactionTypeLabels.EXPENSE}
            value={typesPercentage.EXPENSE}
          />
          <PercentageItem
            icon={<PiggyBankIcon size={16} />}
            title={TransactionTypeLabels.INVESTMENT}
            value={typesPercentage.INVESTMENT}
          />
        </div>
      </CardContent>
    </Card>
  )
}
