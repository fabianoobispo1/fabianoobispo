'use client'

import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from 'convex/react'
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TemplateVariable {
  name: string
  placeholder: string
  type: 'text' | 'number' | 'date' | 'url'
  required: boolean
}

export function GerenciadorTemplates() {
  const { data: session } = useSession()
  const templates = useQuery(api.whatsAppCampaign.getTemplatesByUser, {
    userId: session?.user?.id as Id<'user'>,
  })
  const createTemplate = useMutation(api.whatsAppCampaign.createTemplate)
  const updateTemplate = useMutation(api.whatsAppCampaign.updateTemplate)
  const deleteTemplate = useMutation(api.whatsAppCampaign.deleteTemplate)

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('MARKETING')
  const [content, setContent] = useState('')
  const [variables, setVariables] = useState<TemplateVariable[]>([])
  const [varName, setVarName] = useState('')
  const [varPlaceholder, setVarPlaceholder] = useState('')
  const [varType, setVarType] = useState<'text' | 'number' | 'date' | 'url'>(
    'text',
  )
  const [varRequired, setVarRequired] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const handleAddVariable = () => {
    if (varName && varPlaceholder) {
      const newVar: TemplateVariable = {
        name: varName,
        placeholder: varPlaceholder,
        type: varType,
        required: varRequired,
      }
      setVariables([...variables, newVar])
      setVarName('')
      setVarPlaceholder('')
      setVarType('text')
      setVarRequired(true)
    }
  }

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleSaveTemplate = async () => {
    if (!session?.user?.id) return

    try {
      if (editingId) {
        await updateTemplate({
          templateId: editingId as Id<'whatsAppTemplate'>,
          userId: session.user.id as Id<'user'>,
          name,
          category,
          content,
          variables,
        })
      } else {
        await createTemplate({
          name,
          category,
          content,
          variables,
          userId: session.user.id as Id<'user'>,
        })
      }

      // Reset form
      setName('')
      setCategory('MARKETING')
      setContent('')
      setVariables([])
      setEditingId(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao salvar template:', error)
    }
  }

  const handleEdit = (template: Record<string, unknown>) => {
    setEditingId(template._id as string | null)
    setName(template.name as string)
    setCategory(template.category as string)
    setContent(template.content as string)
    const vars = template.variables as unknown as TemplateVariable[]
    setVariables(vars || [])
    setIsOpen(true)
  }

  const handleDelete = async (templateId: string) => {
    if (confirm('Tem certeza que deseja deletar este template?')) {
      try {
        await deleteTemplate({
          templateId: templateId as Id<'whatsAppTemplate'>,
          userId: session?.user?.id as Id<'user'>,
        })
      } catch (error) {
        console.error('Erro ao deletar template:', error)
      }
    }
  }

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      MARKETING: 'bg-blue-100 text-blue-800',
      TRANSACIONAL: 'bg-green-100 text-green-800',
      OTP: 'bg-red-100 text-red-800',
      NOTIFICACAO: 'bg-yellow-100 text-yellow-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Templates</h2>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie modelos de mensagens profissionais
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setName('')
                setCategory('MARKETING')
                setContent('')
                setVariables([])
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Atualize os detalhes do seu template'
                  : 'Crie um novo modelo de mensagem com variáveis dinâmicas'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="w-full">
              <TabsList>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="variables">Variáveis</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">
                    Nome do Template
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Confirmação de Pedido"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Categoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="TRANSACIONAL">Transacional</SelectItem>
                      <SelectItem value="OTP">OTP (Código)</SelectItem>
                      <SelectItem value="NOTIFICACAO">Notificação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Conteúdo da Mensagem
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva sua mensagem aqui. Use {{1}}, {{2}}, etc. para variáveis"
                    className="mt-2 min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {`{{1}}, {{2}}, {{3}}`} etc. para placeholders de
                    variáveis
                  </p>
                </div>

                {/* Preview */}
                {content && (
                  <Card className="bg-muted/50 p-4">
                    <p className="text-sm font-semibold mb-2">Preview:</p>
                    <p className="text-sm whitespace-pre-wrap">{content}</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                {/* Adicionar Variável */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Adicionar Variável
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold">
                        Nome da Variável
                      </label>
                      <Input
                        value={varName}
                        onChange={(e) => setVarName(e.target.value)}
                        placeholder="Ex: nome_cliente"
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold">
                        Placeholder da Mensagem
                      </label>
                      <Input
                        value={varPlaceholder}
                        onChange={(e) => setVarPlaceholder(e.target.value)}
                        placeholder="Ex: nome"
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold">Tipo</label>
                        <Select
                          value={varType}
                          onValueChange={(v: string) => {
                            setVarType(v as 'text' | 'number' | 'date' | 'url')
                          }}
                        >
                          <SelectTrigger className="mt-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={varRequired}
                            onChange={(e) => setVarRequired(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs">Obrigatório</span>
                        </label>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddVariable}
                      className="w-full"
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Variável
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Variáveis */}
                {variables.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Variáveis Adicionadas ({variables.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {variables.map((variable, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">
                              {variable.placeholder}
                            </p>
                            <p className="text-muted-foreground">
                              {variable.type}
                              {variable.required ? ' • obrigatório' : ''}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveVariable(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editingId ? 'Atualizar' : 'Criar'} Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      {templates === undefined ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum template criado ainda
          </p>
          <Button variant="outline">Criar primeiro template</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template: Record<string, unknown>) => (
            <Card
              key={template._id as string}
              className="hover:border-primary transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{template.name as string}</CardTitle>
                      <Badge
                        className={getCategoryBadgeColor(
                          template.category as string,
                        )}
                      >
                        {template.category as string}
                      </Badge>
                      <Badge
                        className={getStatusBadgeColor(
                          template.status as string,
                        )}
                      >
                        {template.status === 'draft'
                          ? 'Rascunho'
                          : template.status === 'approved'
                            ? 'Aprovado'
                            : 'Rejeitado'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Criado em{' '}
                      {new Date(
                        template.createdAt as number,
                      ).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyContent(template.content as string)
                      }
                    >
                      {copied === template.content ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template._id as string)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 p-3 rounded text-sm whitespace-pre-wrap">
                  {template.content as string}
                </div>
                {(template.variables as Record<string, unknown>[]).length >
                  0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2">
                      Variáveis (
                      {(template.variables as Record<string, unknown>[]).length}
                      )
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(template.variables as Record<string, unknown>[]).map(
                        (variable: Record<string, unknown>, i: number) => (
                          <Badge key={i} variant="outline">
                            {variable.placeholder as string} (
                            {variable.type as string})
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
