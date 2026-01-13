'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, FileText, ArrowRight } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ferramentas = [
  {
    id: 'verificar-template',
    nome: 'Verificar Template',
    descricao: 'Valide templates para Meta WhatsApp Business API',
    icon: FileText,
    route: '/ferramentas/verificar-template',
    categoria: 'Validação',
  },
]

const categorias = ['Validação']

export default function FerramentasPage() {
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Criação')
  const router = useRouter()

  const handleNavigate = () => {
    if (selectedTool) {
      const ferramenta = ferramentas.find((f) => f.id === selectedTool)
      if (ferramenta) {
        router.push(ferramenta.route)
      }
    }
  }

  const selectedToolData = ferramentas.find((f) => f.id === selectedTool)
  const ferramentasPorCategoria = ferramentas.filter(
    (f) => f.categoria === selectedCategory,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Wrench className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Ferramentas</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas públicas para suportar suas operações. Para a suite
            completa de WhatsApp Business com templates, campanhas e
            rastreamento, acesse sua conta.
          </p>
        </div>

        {/* Cards de Categoria */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Selecione uma categoria
          </h2>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedTool('')
                }}
                className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                  selectedCategory === cat
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent hover:border-primary/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Ferramentas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            {selectedCategory === 'Criação' && '📝 Criar e Gerenciar'}
            {selectedCategory === 'Validação' && '✅ Validar'}
            {selectedCategory === 'Envio' && '🚀 Disparar'}
            {selectedCategory === 'Monitoramento' && '📊 Acompanhar'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {ferramentasPorCategoria.map((ferramenta) => {
              const Icon = ferramenta.icon
              return (
                <Card
                  key={ferramenta.id}
                  className={`cursor-pointer hover:border-primary transition-all ${
                    selectedTool === ferramenta.id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => setSelectedTool(ferramenta.id)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {ferramenta.nome}
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                          {ferramenta.descricao}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Detalhe da Ferramenta Selecionada */}
        {selectedToolData && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {selectedToolData.nome}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {selectedToolData.descricao}
                  </CardDescription>
                </div>
                <Badge variant="outline">{selectedToolData.categoria}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleNavigate}
                size="lg"
                className="w-full md:w-auto"
              >
                Acessar Ferramenta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        <div className="grid gap-4 md:grid-cols-3 mt-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Público</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Validação</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ferramenta de apoio gratuita
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Suite Privada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Acesso via dashboard autenticado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-muted-foreground mt-1">
                LGPD, GDPR e conformidade
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
