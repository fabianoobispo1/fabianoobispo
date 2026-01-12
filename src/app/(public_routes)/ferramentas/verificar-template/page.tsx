'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    lines: number
    characters: number
    words: number
    variables: number
  }
}

export default function VerificarTemplatePage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validateTemplate = () => {
    const errors: string[] = []
    const warnings: string[] = []

    // === REGRAS META WHATSAPP BUSINESS API ===

    // Regra 1: Texto não pode estar vazio
    if (!text.trim()) {
      errors.push('O texto não pode estar vazio')
    }

    // Regra 2: Máximo de 1024 caracteres (limite da Meta)
    if (text.length > 1024) {
      errors.push(
        `Template excede o limite de 1024 caracteres (atual: ${text.length})`,
      )
    }

    // Regra 3: Verificar variáveis no formato {{1}}, {{2}}, etc.
    const variablePattern = /\{\{(\d+)\}\}/g
    const variables = text.match(variablePattern)
    const variableNumbers: number[] = []

    if (variables) {
      variables.forEach((v) => {
        const num = parseInt(v.replace(/\{\{|\}\}/g, ''))
        variableNumbers.push(num)
      })

      // Verificar se há mais de 10 variáveis (limite da Meta)
      if (variableNumbers.length > 10) {
        errors.push(
          `Template possui ${variableNumbers.length} variáveis. Máximo permitido: 10`,
        )
      }

      // Verificar se as variáveis são sequenciais
      const uniqueNumbers = [...new Set(variableNumbers)].sort((a, b) => a - b)
      const expectedSequence = Array.from(
        { length: uniqueNumbers.length },
        (_, i) => i + 1,
      )

      if (JSON.stringify(uniqueNumbers) !== JSON.stringify(expectedSequence)) {
        errors.push('Variáveis devem ser sequenciais (ex: {{1}}, {{2}}, {{3}})')
      }

      // Verificar se começa com {{1}}
      if (uniqueNumbers.length > 0 && uniqueNumbers[0] !== 1) {
        errors.push('Variáveis devem começar com {{1}}')
      }
    }

    // Regra 4: Verificar links encurtados (proibido pela Meta)
    const shortLinkPatterns = [
      /bit\.ly/i,
      /tinyurl/i,
      /goo\.gl/i,
      /ow\.ly/i,
      /short\.link/i,
      /t\.co/i,
    ]

    shortLinkPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        errors.push(
          'Links encurtados não são permitidos pela Meta (use links completos)',
        )
      }
    })

    // Regra 5: Verificar espaços duplos (não permitido)
    if (text.includes('  ')) {
      errors.push('Espaços duplos não são permitidos no template')
    }

    // Regra 6: Verificar formatação inválida
    // Verificar se há asteriscos, sublinhados ou til sem fechamento
    const allBolds = text.match(/\*/g)
    if (allBolds && allBolds.length % 2 !== 0) {
      warnings.push('Formatação de negrito (*) incompleta ou mal formada')
    }

    const allItalics = text.match(/_/g)
    if (allItalics && allItalics.length % 2 !== 0) {
      warnings.push('Formatação de itálico (_) incompleta ou mal formada')
    }

    const allStrikes = text.match(/~/g)
    if (allStrikes && allStrikes.length % 2 !== 0) {
      warnings.push('Formatação de tachado (~) incompleta ou mal formada')
    }

    // Regra 7: Verificar emojis problemáticos ou caracteres especiais não suportados
    const unsupportedChars = text.match(/[\u200B-\u200D\uFEFF]/g)
    if (unsupportedChars) {
      warnings.push(
        'Detectados caracteres invisíveis que podem causar problemas',
      )
    }

    // Regra 8: Verificar se tem linhas muito longas
    const lines = text.split('\n')
    const longLines = lines.filter((line) => line.length > 120)
    if (longLines.length > 0) {
      warnings.push(
        `${longLines.length} linha(s) possui(em) mais de 120 caracteres (considere quebrar)`,
      )
    }

    // Regra 9: Verificar URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlPattern)
    if (urls) {
      warnings.push(
        `Template contém ${urls.length} URL(s). Certifique-se de que são válidas`,
      )
    }

    // Regra 10: Verificar palavras em CAPS LOCK excessivo
    const capsWords = text.match(/[A-Z]{5,}/g)
    if (capsWords && capsWords.length > 0) {
      warnings.push(
        `${capsWords.length} palavra(s) em CAPS LOCK excessivo (pode parecer spam)`,
      )
    }

    // Estatísticas
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    setResult({
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        lines: lines.length,
        characters: text.length,
        words,
        variables: variableNumbers.length,
      },
    })
  }

  const handleClear = () => {
    setText('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Link href="/ferramentas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Verificar Template WhatsApp
              </h1>
              <p className="text-muted-foreground">
                Valide templates para Meta WhatsApp Business API antes de enviar
              </p>
            </div>
          </div>
        </div>

        {/* Card de Input */}
        <Card>
          <CardHeader>
            <CardTitle>Cole seu template WhatsApp</CardTitle>
            <CardDescription>
              Insira o template que deseja validar conforme as regras da Meta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`Cole seu template aqui...\n\nExemplo com variáveis:\nOlá *{{1}}*, sua compra de *{{2}}* foi confirmada!`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex gap-2">
              <Button
                onClick={validateTemplate}
                className="flex-1"
                disabled={!text.trim()}
              >
                Verificar Template
              </Button>
              <Button onClick={handleClear} variant="outline">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {result && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {/* Status Geral */}
            <Alert variant={result.isValid ? 'default' : 'destructive'}>
              {result.isValid ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.isValid ? 'Template Válido!' : 'Template com Erros'}
              </AlertTitle>
              <AlertDescription>
                {result.isValid
                  ? 'Seu template passou em todas as validações obrigatórias.'
                  : 'Foram encontrados erros que precisam ser corrigidos.'}
              </AlertDescription>
            </Alert>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Caracteres</p>
                    <p className="text-2xl font-bold">
                      {result.stats.characters}
                      <span className="text-sm text-muted-foreground font-normal">
                        {' '}
                        / 1024
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Palavras</p>
                    <p className="text-2xl font-bold">{result.stats.words}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Linhas</p>
                    <p className="text-2xl font-bold">{result.stats.lines}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Variáveis</p>
                    <p className="text-2xl font-bold">
                      {result.stats.variables}
                      <span className="text-sm text-muted-foreground font-normal">
                        {' '}
                        / 10
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Erros */}
            {result.errors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-lg">
                      Erros ({result.errors.length})
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Os seguintes erros precisam ser corrigidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant="destructive" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{error}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Avisos */}
            {result.warnings.length > 0 && (
              <Card className="border-yellow-500/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-lg">
                      Avisos ({result.warnings.length})
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Sugestões de melhorias para o seu texto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="mt-0.5 border-yellow-600"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Regras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Regras Meta WhatsApp Business API
            </CardTitle>
            <CardDescription>
              Validações baseadas nas diretrizes oficiais da Meta para templates
              de mensagens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Erros Críticos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">
                  ❌ Regras Obrigatórias
                </h3>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="destructive" className="mt-0.5">
                    1
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Limite de caracteres</p>
                    <p className="text-xs text-muted-foreground">
                      Máximo de 1024 caracteres no body do template
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="destructive" className="mt-0.5">
                    2
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Variáveis sequenciais</p>
                    <p className="text-xs text-muted-foreground">
                      Use{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {'{{1}}'}
                      </code>
                      ,{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {'{{2}}'}
                      </code>
                      , etc. Máximo de 10 variáveis
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="destructive" className="mt-0.5">
                    3
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Sem links encurtados</p>
                    <p className="text-xs text-muted-foreground">
                      Não use bit.ly, tinyurl, goo.gl, etc. Use URLs completas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="destructive" className="mt-0.5">
                    4
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Sem espaços duplos</p>
                    <p className="text-xs text-muted-foreground">
                      Espaços duplos consecutivos não são permitidos
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Avisos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">⚠️ Boas Práticas</h3>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="outline" className="mt-0.5 border-yellow-600">
                    1
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Formatação suportada</p>
                    <p className="text-xs text-muted-foreground">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        *negrito*
                      </code>
                      ,{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        _itálico_
                      </code>
                      ,{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        ~tachado~
                      </code>
                      ,{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        ```código```
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="outline" className="mt-0.5 border-yellow-600">
                    2
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Evite CAPS LOCK</p>
                    <p className="text-xs text-muted-foreground">
                      Muitas palavras em maiúsculas podem ser sinalizadas como
                      spam
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pl-4">
                  <Badge variant="outline" className="mt-0.5 border-yellow-600">
                    3
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Linhas curtas</p>
                    <p className="text-xs text-muted-foreground">
                      Evite linhas com mais de 120 caracteres para melhor
                      legibilidade
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Exemplo */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">📝 Exemplo Válido</h3>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {`Olá *{{1}}*! 👋

Sua compra de *{{2}}* foi confirmada com sucesso!

Valor: R$ {{3}}
Previsão de entrega: {{4}}

_Obrigado por comprar conosco!_`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
