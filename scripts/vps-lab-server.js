#!/usr/bin/env node

/**
 * VPS Lab Server - Gerencia containers Docker para labs interativos
 *
 * Instale as dependências:
 * npm install express dockerode dotenv
 *
 * Rode com:
 * VPS_API_KEY=seu-secret-key PORT=3001 node vps-lab-server.js
 *
 * Ou configure como serviço systemd:
 * /etc/systemd/system/lab-server.service
 */

const express = require('express')
const Docker = require('dockerode')
const dotenv = require('dotenv')
const { v4: uuidv4 } = require('uuid')

dotenv.config()

const app = express()
const docker = new Docker({ socketPath: '/var/run/docker.sock' })

const VPS_API_KEY = process.env.VPS_API_KEY || 'seu-secret-key'
const PORT = process.env.PORT || 3001
const LAB_NETWORK = 'labs-network'
const LAB_IMAGE = process.env.LAB_IMAGE || 'ubuntu:latest'

// Middleware
app.use(express.json())

// Auth middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== VPS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

// Garante que a rede existe
async function ensureNetwork() {
  try {
    const network = docker.getNetwork(LAB_NETWORK)
    await network.inspect()
  } catch (err) {
    console.log(`Criando rede Docker: ${LAB_NETWORK}`)
    await docker.createNetwork({
      Name: LAB_NETWORK,
      Driver: 'bridge',
    })
  }
}

// Função para encontrar porta SSH disponível
async function findAvailablePort() {
  for (let port = 2222; port < 2300; port++) {
    try {
      const container = docker.getContainer(`lab-port-${port}`)
      await container.inspect()
    } catch {
      return port
    }
  }
  throw new Error('Nenhuma porta disponível')
}

// POST /api/lab/create - Cria um novo container
app.post('/api/lab/create', async (req, res) => {
  try {
    const { userId, name } = req.body

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId e name são obrigatórios' })
    }

    // Limita labs por usuário
    const containers = await docker.listContainers({
      filters: { label: [`userId=${userId}`] },
    })

    if (containers.length >= 3) {
      return res.status(400).json({ error: 'Limite de 3 labs atingido' })
    }

    const port = await findAvailablePort()
    const containerId = uuidv4().slice(0, 12)

    // Cria container com limite de recursos
    const container = await docker.createContainer({
      Image: LAB_IMAGE,
      Hostname: name,
      Labels: {
        userId,
        createdAt: Date.now().toString(),
        managedBy: 'lab-server',
      },
      Env: ['PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'],
      HostConfig: {
        CpuQuotas: 200000, // 0.2 CPU
        Memory: 512 * 1024 * 1024, // 512 MB
        PortBindings: {
          '22/tcp': [{ HostPort: port.toString() }],
        },
        NetworkMode: LAB_NETWORK,
      },
      ExposedPorts: {
        '22/tcp': {},
      },
    })

    await container.start()

    // Aguarda container estar pronto (delay simples)
    await new Promise(r => setTimeout(r, 2000))

    const inspect = await container.inspect()
    const ip = inspect.NetworkSettings.Networks[LAB_NETWORK]?.IPAddress

    res.json({
      id: containerId,
      name,
      ip: ip || 'pending',
      port,
      status: 'running',
      ssh: `ssh -p ${port} root@sua-vps.com`,
      note: 'Container criado, tente fazer SSH em ~10 segundos',
    })
  } catch (err) {
    console.error('Erro ao criar lab:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/lab/:id/delete - Deleta um container
app.delete('/api/lab/:id/delete', async (req, res) => {
  try {
    const { id } = req.params

    const containers = await docker.listContainers({
      all: true,
      filters: { label: ['managedBy=lab-server'] },
    })

    const container = containers.find(c => c.Id.startsWith(id))

    if (!container) {
      return res.status(404).json({ error: 'Lab não encontrado' })
    }

    const dockerContainer = docker.getContainer(container.Id)

    // Para se estiver rodando
    if (container.State === 'running') {
      await dockerContainer.stop({ t: 5 })
    }

    // Remove o container
    await dockerContainer.remove()

    res.json({ status: 'deleted', id: container.Id.slice(0, 12) })
  } catch (err) {
    console.error('Erro ao deletar lab:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/lab/:id/info - Info do container
app.get('/api/lab/:id/info', async (req, res) => {
  try {
    const { id } = req.params

    const containers = await docker.listContainers({
      all: true,
      filters: { label: ['managedBy=lab-server'] },
    })

    const container = containers.find(c => c.Id.startsWith(id))

    if (!container) {
      return res.status(404).json({ error: 'Lab não encontrado' })
    }

    const dockerContainer = docker.getContainer(container.Id)
    const inspect = await dockerContainer.inspect()

    res.json({
      id: container.Id.slice(0, 12),
      name: inspect.Config.Hostname,
      status: container.State,
      ports: container.Ports,
      created: container.Created,
    })
  } catch (err) {
    console.error('Erro ao pegar info:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

// Start server
ensureNetwork().then(() => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Lab Server rodando em http://127.0.0.1:${PORT}`)
    console.log(`VPS_API_KEY: ${VPS_API_KEY.substring(0, 10)}...`)
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...')
  process.exit(0)
})
