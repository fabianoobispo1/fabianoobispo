'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, ReferenceDot, XAxis, YAxis } from 'recharts'
import { RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

// Mesma regra usada no dashboard real (convex/solar.ts): perda linear por
// dia sem limpeza, com teto — mantida em sincronia manualmente aqui porque
// esta página é pública e não deve importar código gerado do Convex.
const LOSS_PER_DAY_PERCENT = 0.3
const MAX_LOSS_PERCENT = 30
const ESTIMATED_TARIFF_PER_KWH = 0.75 // R$/kWh, estimativa média residencial

function efficiencyForDays(days: number) {
  const loss = Math.min(MAX_LOSS_PERCENT, days * LOSS_PER_DAY_PERCENT)
  return 100 - loss
}

const chartConfig = {
  efficiency: {
    label: 'Eficiência (%)',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

export function EfficiencyDemo() {
  const [dailyGenerationKwh, setDailyGenerationKwh] = useState(30)
  const [daysSinceCleaning, setDaysSinceCleaning] = useState(20)

  const efficiencyPercent = efficiencyForDays(daysSinceCleaning)
  const lossPercent = 100 - efficiencyPercent
  const lostKwhPerDay = (dailyGenerationKwh * lossPercent) / 100
  const lostReaisPerDay = lostKwhPerDay * ESTIMATED_TARIFF_PER_KWH

  const curveData = useMemo(
    () =>
      Array.from({ length: 61 }, (_, day) => ({
        day,
        efficiency: efficiencyForDays(day),
      })),
    [],
  )

  return (
    <div id="demo" className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Simule a sua usina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="daily-generation">
              Geração média diária sem sujeira (kWh)
            </Label>
            <Input
              id="daily-generation"
              type="number"
              min={0}
              step="0.5"
              value={dailyGenerationKwh}
              onChange={(e) =>
                setDailyGenerationKwh(Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="days-since-cleaning">
                Dias desde a última limpeza
              </Label>
              <span className="text-sm font-medium text-muted-foreground">
                {daysSinceCleaning} dia(s)
              </span>
            </div>
            <Slider
              id="days-since-cleaning"
              min={0}
              max={60}
              step={1}
              value={[daysSinceCleaning]}
              onValueChange={([value]) => setDaysSinceCleaning(value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setDaysSinceCleaning(0)}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Simular limpeza agora
          </Button>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Eficiência atual
              </span>
              <span className="text-2xl font-semibold text-amber-500">
                {efficiencyPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={efficiencyPercent} />
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <p className="text-muted-foreground">Perda estimada</p>
                <p className="font-medium">
                  {lostKwhPerDay.toFixed(1)} kWh/dia
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Custo estimado</p>
                <p className="font-medium">
                  R$ {lostReaisPerDay.toFixed(2)}/dia
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curva de perda por sujeira</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={curveData}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(day) => `${day}d`}
              />
              <YAxis
                domain={[60, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(day) => `${day} dia(s) sem limpar`}
              />
              <Area
                dataKey="efficiency"
                type="monotone"
                fill="var(--color-efficiency)"
                fillOpacity={0.2}
                stroke="var(--color-efficiency)"
              />
              <ReferenceDot
                x={daysSinceCleaning}
                y={efficiencyPercent}
                r={5}
                fill="hsl(var(--chart-4))"
                stroke="white"
              />
            </AreaChart>
          </ChartContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Estimativa ilustrativa: perda de {LOSS_PER_DAY_PERCENT}% de
            eficiência por dia sem limpeza, até um teto de {MAX_LOSS_PERCENT}%.
            Os valores reais variam por região, clima e tipo de placa.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
