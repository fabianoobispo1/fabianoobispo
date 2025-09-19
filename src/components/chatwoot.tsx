'use client'
import { useEffect } from 'react'
declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void
    }
  }
}
declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void
    }
  }
}

const Chatwoot = () => {
  useEffect(() => {
    ;(function (d, t) {
      const BASE_URL = 'https://chatwoot.fabianoobispo.com.br'
      const g = d.createElement(t) as HTMLScriptElement
      const s = d.getElementsByTagName(t)[0]
      g.src = BASE_URL + '/packs/js/sdk.js'
      g.defer = true
      g.async = true
      if (s.parentNode) {
        s.parentNode.insertBefore(g, s)
      }
      g.onload = function () {
        window.chatwootSDK?.run({
          websiteToken: 'kzKucnbfRuHWmkzzpew8pNN2',
          baseUrl: BASE_URL,
        })
      }
    })(document, 'script')
  }, [])

  return null // Não renderiza nada na tela
}

export default Chatwoot
