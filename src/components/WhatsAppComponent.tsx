'use client'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/utils'

import { ScrollArea } from './ui/scroll-area'

export function WhatsAppComponent() {
  const { data: session } = useSession()
  const [carregou, setiscarregou] = useState(false)
  const router = useRouter()
  if (session) {
    /*     console.log(session) */

    if (!carregou) {
      console.log(session.user.nome)
      if (
        session.user.email === 'fbc623@gmail.com' ||
        session.user.email === 'markinjr92@gmail.com'
      ) {
        console.log('ok')
      } else {
        router.push('https://www.jfimperadores.com.br/dashboard')
      }
      setiscarregou(true)
    }
  }

  /*  const [sessionData, setSessionData] = useState(null) */
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrKey, setQrKey] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [numeroConectado, setNumeroConectado] = useState('')
  const [nomeConectado, setNomeConectado] = useState('')
  const [mesageColor, setMesageColor] = useState('')

  const startWhatsAppSession = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/whatsapp/start')
      /* setSessionData(response.data) */
      console.log(response.data)
    } catch (error) {
      console.error('Error starting WhatsApp session:', error)
    }
    checkStatus()
    setLoading(false)
  }

  const terminateWhatsAppSessions = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/whatsapp/terminate')
      /* setSessionData(response.data) */
      console.log(response.data)
      setShowQR(false)
    } catch (error) {
      console.error('Error terminating WhatsApp sessions:', error)
    }
    checkStatus()
    setLoading(false)
  }

  const fetchQRCode = () => {
    setShowQR(true)
    setQrKey((prev) => prev + 1)
  }

  const sendMessage = async () => {
    setLoading(true)
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const chatId = `55${formattedPhone}@c.us`

      const response = await axios.post('/api/whatsapp/sendMessage', {
        chatId,
        contentType: 'string',
        content: message,
      })

      setMessage('')
      /* setSessionData(response.data) */
      console.log(response.data)
    } catch (error) {
      console.error('Error sending message:', error)
    }
    checkStatus()
    setLoading(false)
  }

  const getNumber = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/whatsapp/getNumber')
      setNomeConectado(response.data.sessionInfo.pushname)
      setNumeroConectado(
        response.data.sessionInfo.me.user.slice(2, 4) +
          '9' +
          response.data.sessionInfo.me.user.slice(4),
      )
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }, [setLoading, setNumeroConectado])

  const checkStatus = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/whatsapp/status')

      if (response.data.message === 'session_not_found') {
        setStatusMessage('Sessão não iniciada.')
        setMesageColor('text-red-500')
      } else if (response.data.message === 'session_not_connected') {
        setStatusMessage('Sessão Iniciada, falta ler QR Code.')
        setMesageColor('text-blue-600')
      } else if (response.data.message === 'session_connected') {
        getNumber()
        setMesageColor('text-green-500')
        setStatusMessage('Conectado')
      } else {
        setMesageColor('text-red-500')
        setStatusMessage('Erro Interno.')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
    setLoading(false)
  }, [getNumber, setLoading, setStatusMessage, setMesageColor])

  useEffect(() => {
    const interval = setInterval(checkStatus, 5000)
    checkStatus() // Initial check

    return () => clearInterval(interval)
  }, [checkStatus])
  return (
    <ScrollArea className="h-[calc(100vh-220px)] w-full overflow-x-auto ">
      <div className=" space-y-4">
        <p className="text-sm font-medium">
          Status:{' '}
          <span className={mesageColor}>
            {''} {statusMessage}
          </span>
        </p>
        <p className="text-sm font-medium">
          Número Conectado:{' '}
          <span>
            {''}
            {numeroConectado === '' ? '-' : formatPhone(numeroConectado)}
            {' - '}
            {nomeConectado === '' ? '-' : nomeConectado}
          </span>
        </p>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={startWhatsAppSession} disabled={loading}>
            Iniciar sessão
          </Button>

          <Button
            onClick={terminateWhatsAppSessions}
            disabled={loading}
            variant="destructive"
          >
            Terminar sessão
          </Button>

          <Button onClick={fetchQRCode} disabled={loading} variant="outline">
            gerar QR Code
          </Button>

          <Button onClick={checkStatus} disabled={loading} variant="secondary">
            Verfica status
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          <h3 className="text-lg font-semibold">Teste enviar mensagem</h3>
          <div className="flex flex-col gap-2 max-w-md">
            <Input
              placeholder="Numero telefone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Input
              placeholder="Mensagem"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !phoneNumber || !message}
            >
              Enviar
            </Button>
          </div>
        </div>

        {showQR && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">QR Code</h3>
            <div className="border rounded p-4 inline-block bg-white relative">
              <Button
                onClick={() => setShowQR(false)}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
              >
                ✕
              </Button>
              <Image
                key={qrKey}
                src="/api/whatsapp/qrcode"
                alt="WhatsApp QR Code"
                width={256}
                height={256}
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* {sessionData && (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        )} */}
      </div>
    </ScrollArea>
  )
}
