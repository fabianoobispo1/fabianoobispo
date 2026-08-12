/**
 * Serviço SSH Client
 *
 * Este módulo gerencia conexões SSH usando a biblioteca ssh2
 * e fornece interface simples para terminal interativo
 */

/**
 * Interface de configuração SSH
 */
export interface SSHConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string | Buffer
  privateKeyPassphrase?: string
  readyTimeout?: number
  tryKeyboard?: boolean
  algorithms?: {
    cipher?: string[]
    serverHostKey?: string[]
    kex?: string[]
    serverEncryption?: string[]
  }
}

/**
 * Interface de evento SSH
 */
export interface SSHEvent {
  type: 'connect' | 'output' | 'error' | 'close' | 'ready'
  data?: string | Buffer
  message?: string
}

/**
 * Classe para gerenciar conexões SSH
 *
 * NOTA: Esta é uma implementação de placeholder.
 * Para usar em produção, você precisa:
 *
 * 1. Instalar ssh2:
 *    npm install ssh2
 *
 * 2. Usar a implementação real com:
 *    import { Client } from 'ssh2'
 *
 * 3. Chamar este serviço do seu WebSocket API
 */
export class SSHClient {
  private config: SSHConfig
  private isConnected: boolean = false
  private shell: unknown = null // Tipo shell do ssh2
  private events: Array<(event: SSHEvent) => void> = []

  constructor(config: SSHConfig) {
    this.config = {
      readyTimeout: 10000,
      tryKeyboard: true,
      ...config,
    }
  }

  /**
   * Conecta ao servidor SSH
   */
  async connect(): Promise<void> {
    try {
      // Verificar variáveis de ambiente
      if (!this.config.host) {
        throw new Error('SSH_HOST não configurado em .env.local')
      }

      if (!this.config.username) {
        throw new Error('SSH_USER não configurado em .env.local')
      }

      if (!this.config.password && !this.config.privateKey) {
        throw new Error(
          'SSH_PASSWORD ou SSH_PRIVATE_KEY deve estar configurado em .env.local',
        )
      }

      this.emit({
        type: 'connect',
        message: `Conectando a ${this.config.host}:${this.config.port}...`,
      })

      // IMPLEMENTAÇÃO REAL (descomente quando ssh2 estiver instalado):
      /*
      const { Client } = require('ssh2')
      const conn = new Client()

      conn.on('ready', () => {
        this.emit({ type: 'ready', message: 'Conexão SSH estabelecida' })
        this.isConnected = true
        this.openShell()
      })

      conn.on('error', (err: Error) => {
        this.emit({ type: 'error', message: `Erro SSH: ${err.message}` })
      })

      conn.on('close', () => {
        this.emit({ type: 'close', message: 'Conexão fechada' })
        this.isConnected = false
      })

      conn.connect(this.config)
      */

      // PLACEHOLDER para desenvolvimento
      this.emit({
        type: 'ready',
        message: 'SSH não está totalmente configurado ainda.',
      })
      this.emit({
        type: 'output',
        data: '\n✅ Estrutura do terminal SSH está pronta!\n',
      })
      this.emit({
        type: 'output',
        data: 'Próximos passos:\n',
      })
      this.emit({
        type: 'output',
        data: '1. npm install ssh2 xterm\n',
      })
      this.emit({
        type: 'output',
        data: '2. Configure .env.local com credenciais SSH\n',
      })
      this.emit({
        type: 'output',
        data: '3. Implemente a conexão real em src/services/ssh-client.ts\n',
      })
      this.isConnected = true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      this.emit({ type: 'error', message })
      throw error
    }
  }

  /**
   * Abre shell interativo
   */
  private async openShell(): Promise<void> {
    // Implementação real seria aqui
  }

  /**
   * Envia comando ao shell
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `command` será usado quando a implementação real (ssh2) for conectada
  async sendCommand(command: string): Promise<void> {
    if (!this.isConnected) {
      this.emit({
        type: 'error',
        message: 'Não conectado ao servidor SSH',
      })
    }

    // Implementação real:
    // this.shell.write(command + '\n')
  }

  /**
   * Redimensiona terminal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `cols`/`rows` serão usados quando a implementação real (ssh2) for conectada
  async resize(cols: number, rows: number): Promise<void> {
    // Implementação real:
    // this.shell.setWindow(rows, cols, rows * 15, cols * 8)
  }

  /**
   * Registra listener para eventos
   */
  on(callback: (event: SSHEvent) => void): () => void {
    this.events.push(callback)
    return () => {
      this.events = this.events.filter((e) => e !== callback)
    }
  }

  /**
   * Emite evento para listeners
   */
  private emit(event: SSHEvent): void {
    this.events.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Erro ao processar evento SSH:', error)
      }
    })
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    if (this.isConnected) {
      this.emit({ type: 'close', message: 'Desconectando...' })
      this.isConnected = false
      // conn.end() na implementação real
    }
  }

  /**
   * Verifica se está conectado
   */
  getStatus(): { connected: boolean; host?: string } {
    return {
      connected: this.isConnected,
      host: this.isConnected ? this.config.host : undefined,
    }
  }
}

/**
 * Factory para criar cliente SSH com variáveis de ambiente
 */
export function createSSHClientFromEnv(): SSHClient {
  const config: SSHConfig = {
    host: process.env.SSH_HOST || 'localhost',
    port: parseInt(process.env.SSH_PORT || '22', 10),
    username: process.env.SSH_USER || 'root',
    password: process.env.SSH_PASSWORD,
    privateKey: process.env.SSH_PRIVATE_KEY
      ? Buffer.from(process.env.SSH_PRIVATE_KEY)
      : undefined,
    privateKeyPassphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE,
    readyTimeout: parseInt(process.env.SSH_TIMEOUT || '10000', 10),
  }

  return new SSHClient(config)
}
