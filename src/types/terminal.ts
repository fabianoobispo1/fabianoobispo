/**
 * Types para Terminal SSH
 */

/**
 * Comando do terminal
 */
export type TerminalCommand =
  | 'start'      // Inicia conexão SSH
  | 'send'       // Envia comando
  | 'resize'     // Redimensiona terminal
  | 'close'      // Fecha conexão

/**
 * Tipo de mensagem WebSocket
 */
export type TerminalMessageType =
  | 'output'     // Output do terminal
  | 'error'      // Erro
  | 'ready'      // Pronto para usar
  | 'closed'     // Conexão fechada
  | 'config_required' // Configuração necessária

/**
 * Mensagem enviada ao servidor
 */
export interface TerminalMessage {
  command: TerminalCommand
  data?: string
  cols?: number
  rows?: number
  timestamp?: number
}

/**
 * Resposta do servidor
 */
export interface TerminalResponse {
  type: TerminalMessageType
  data?: string
  message?: string
  status?: 'ok' | 'error'
  timestamp?: number
}

/**
 * Configuração do terminal
 */
export interface TerminalConfig {
  cols: number
  rows: number
  fontFamily: string
  fontSize: number
  cursorBlinkInterval: number
  theme: {
    background: string
    foreground: string
    cursor: string
    cursorAccent: string
  }
}

/**
 * Status da conexão
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed'

/**
 * Dados de sessão do terminal
 */
export interface TerminalSession {
  id: string
  userId: string
  email: string
  host: string
  port: number
  username: string
  startTime: Date
  endTime?: Date
  status: ConnectionStatus
  commandCount: number
  outputSize: number // em bytes
}

/**
 * Log de atividade do terminal
 */
export interface TerminalActivityLog {
  sessionId: string
  timestamp: Date
  type: 'connect' | 'command' | 'output' | 'disconnect' | 'error'
  content: string
  isError?: boolean
}

/**
 * Configurações de segurança
 */
export interface TerminalSecurityConfig {
  authorizedEmails: string[]
  maxSessions: number
  sessionTimeout: number // em ms
  enableLogging: boolean
  ipWhitelist?: string[]
  requireMFA?: boolean
}

/**
 * Resposta de autenticação
 */
export interface TerminalAuthResponse {
  authorized: boolean
  message: string
  user?: {
    email: string
    role: string
  }
  sessionToken?: string
}
