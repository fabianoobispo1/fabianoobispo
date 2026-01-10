'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  ListTodo,
  FileText,
  Dumbbell,
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatCurrency } from '@/lib/utils'

export function DashboardOverview() {
  const { data: session } = useSession()
  const userId = session?.user?.id as Id<'user'>

  // Buscar dados do mês atual
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const dashboard = useQuery(
    api.transaction.getDashboard,
    userId ? { month: currentMonth, userId } : 'skip',
  )

  // Buscar todos
  const todos = useQuery(api.todo.getTodoByUser, userId ? { userId } : 'skip')

  const pendingTodos = todos?.filter((t) => !t.isCompleted).length || 0
  const completedTodos = todos?.filter((t) => t.isCompleted).length || 0

  const isLoading = !dashboard || !todos

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-1 h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Financeiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                dashboard.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(dashboard.balance)}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {monthName} {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard.depositsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.lastTransactions.filter((t) => t.type === 'DEPOSIT')
                .length || 0}{' '}
              transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboard.expensesTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.lastTransactions.filter((t) => t.type === 'EXPENSE')
                .length || 0}{' '}
              transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboard.investmentsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.lastTransactions.filter((t) => t.type === 'INVESTMENT')
                .length || 0}{' '}
              transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Ações Rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/financas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gerenciar Finanças
              </CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Visualize seu dashboard financeiro completo
              </p>
              <Button variant="ghost" size="sm" className="w-full">
                Acessar Finanças <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/lista">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lista de Tarefas
              </CardTitle>
              <ListTodo className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-muted-foreground">
                  {pendingTodos} pendentes • {completedTodos} concluídas
                </p>
              </div>
              <Button variant="ghost" size="sm" className="w-full">
                Ver Tarefas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/fichaexercicios">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ficha de Treinos
              </CardTitle>
              <Dumbbell className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Gerencie seus treinos e exercícios
              </p>
              <Button variant="ghost" size="sm" className="w-full">
                Ver Treinos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Últimas Transações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimas Transações</CardTitle>
          <Link href="/dashboard/financas/transactions">
            <Button variant="ghost" size="sm">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {dashboard.lastTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma transação registrada ainda
              </p>
              <Link href="/dashboard/financas">
                <Button variant="outline" size="sm" className="mt-3">
                  Adicionar Transação
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.lastTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        transaction.type === 'DEPOSIT'
                          ? 'bg-green-100 dark:bg-green-900'
                          : transaction.type === 'EXPENSE'
                            ? 'bg-red-100 dark:bg-red-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                      }`}
                    >
                      {transaction.type === 'DEPOSIT' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : transaction.type === 'EXPENSE' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}{' '}
                        • {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${
                      transaction.type === 'DEPOSIT'
                        ? 'text-green-600'
                        : transaction.type === 'EXPENSE'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {transaction.type === 'DEPOSIT' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
