'use client'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { moedaMask } from '@/lib/utils'

import type { Id } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { Spinner } from '../ui/spinner'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

interface FinanceiroItem {
  _id: Id<'financeiro'>
  descricao: string
  valor: number
  dataVencimento: number
  dataPagamento?: number
  categoria: string
  status: string
  created_at: number
  updated_at: number
  userId: Id<'user'>
}
interface CartoesItem {
  _id: Id<'cartoes'>
  descricao: string
  valor: number
  dataVencimento: number
  dataPagamento?: number
  categoria: string
  status: string
  created_at: number
  updated_at: number
  obs: string
  limite: number
  limiteUtilizado: number
  userId: Id<'user'>
}

export const FinancialDashboard = () => {
  const { data: session } = useSession()
  const dashboardData = useQuery(api.dashboard.getDashboardData, {
    userId: session?.user?.id as Id<'user'>,
  })

  const [monthlyTotals, setMonthlyTotals] = useState<{
    labels: string[]
    expenses: number[]
    income: number[]
  }>({ labels: [], expenses: [], income: [] })

  const [categoryData, setCategoryData] = useState<{
    labels: string[]
    values: number[]
  }>({ labels: [], values: [] })

  useEffect(() => {
    if (dashboardData) {
      processData(dashboardData.financeiro, dashboardData.cartoes)
    }
  }, [dashboardData])

  if (!dashboardData) {
    return <Spinner />
  }

  const { financeiro, cartoes } = dashboardData

  // Cálculos dos totais
  const totalContas = financeiro.reduce((acc, conta) => acc + conta.valor, 0)
  const totalCartoes = cartoes.reduce((acc, cartao) => acc + cartao.valor, 0)
  const limiteTotal = cartoes.reduce((acc, cartao) => acc + cartao.limite, 0)
  const limiteUtilizado = cartoes.reduce(
    (acc, cartao) => acc + cartao.limiteUtilizado,
    0,
  )

  const processData = (
    financeiro: FinanceiroItem[],
    cartoes: CartoesItem[],
  ) => {
    // Processar dados mensais
    const monthlyData = [...financeiro, ...cartoes].reduce(
      (acc, item) => {
        const date = new Date(item.dataVencimento)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

        if (!acc[monthYear]) {
          acc[monthYear] = { expenses: 0, income: 0 }
        }

        if (item.valor < 0) {
          acc[monthYear].expenses += Math.abs(item.valor)
        } else {
          acc[monthYear].income += item.valor
        }

        return acc
      },
      {} as Record<string, { expenses: number; income: number }>,
    )

    // Processar dados por categoria
    const categoryTotals = [...financeiro, ...cartoes].reduce(
      (acc, item) => {
        if (!acc[item.categoria]) {
          acc[item.categoria] = 0
        }
        acc[item.categoria] += Math.abs(item.valor)
        return acc
      },
      {} as Record<string, number>,
    )

    setMonthlyTotals({
      labels: Object.keys(monthlyData),
      expenses: Object.values(monthlyData).map((d) => d.expenses),
      income: Object.values(monthlyData).map((d) => d.income),
    })

    setCategoryData({
      labels: Object.keys(categoryTotals),
      values: Object.values(categoryTotals),
    })
  }

  const lineChartData = {
    labels: monthlyTotals.labels,
    datasets: [
      {
        label: 'Despesas',
        data: monthlyTotals.expenses,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Receitas',
        data: monthlyTotals.income,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  }

  const pieChartData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Evolução Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={lineChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Receitas x Despesas',
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Pie
            data={pieChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Contas:</span>
              <span className="font-bold">
                {moedaMask(totalContas.toString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Cartões:</span>
              <span className="font-bold">
                {moedaMask(totalCartoes.toString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Geral:</span>
              <span className="font-bold">
                {moedaMask((totalContas + totalCartoes).toString())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utilização de Limite */}
      <Card>
        <CardHeader>
          <CardTitle>Limites dos Cartões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Limite Total:</span>
              <span className="font-bold">
                {moedaMask(limiteTotal.toString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Limite Utilizado:</span>
              <span className="font-bold">
                {moedaMask(limiteUtilizado.toString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Limite Disponível:</span>
              <span className="font-bold">
                {moedaMask((limiteTotal - limiteUtilizado).toString())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>Contas:</div>
            <div className="flex justify-between">
              <span>Pendentes:</span>
              <span className="font-bold">
                {financeiro.filter((f) => f.status === 'PENDENTE').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Atrasadas:</span>
              <span className="font-bold text-red-500">
                {financeiro.filter((f) => f.status === 'ATRASADO').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
