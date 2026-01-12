'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, FileText, ArrowRight } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ferramentas = [
  {
    id: 'verificar-template',
    nome: 'Verificar Template',
    descricao: 'Valide templates para Meta WhatsApp Business API',
    icon: FileText,
    route: '/ferramentas/verificar-template',
  },
  // Adicione mais ferramentas aqui no futuro
]

export default function FerramentasPage() {
  const [selectedTool, setSelectedTool] = useState<string>('')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Wrench className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Ferramentas</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Selecione uma ferramenta abaixo para começar a usar
          </p>
        </div>

        {/* Seletor de Ferramenta */}
        <Card>
          <CardHeader>
            <CardTitle>Escolha uma Ferramenta</CardTitle>
            <CardDescription>
              Selecione no dropdown abaixo a ferramenta que deseja utilizar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma ferramenta..." />
              </SelectTrigger>
              <SelectContent>
                {ferramentas.map((ferramenta) => (
                  <SelectItem key={ferramenta.id} value={ferramenta.id}>
                    {ferramenta.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedToolData && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3 animate-in fade-in-50 duration-300">
                <div className="flex items-start gap-3">
                  <selectedToolData.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold">{selectedToolData.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedToolData.descricao}
                    </p>
                  </div>
                </div>
                <Button onClick={handleNavigate} className="w-full" size="lg">
                  Acessar Ferramenta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grid de Todas as Ferramentas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Ferramentas Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ferramentas.map((ferramenta) => {
              const Icon = ferramenta.icon
              return (
                <Card
                  key={ferramenta.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => router.push(ferramenta.route)}
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
      </div>
    </div>
  )
}
