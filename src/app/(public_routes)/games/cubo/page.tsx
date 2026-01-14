'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const RubiksCube3D = dynamic(() => import('@/components/games/RubiksCube3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <p>Carregando cubo...</p>
    </div>
  ),
})

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cubo Mágico</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Versão 3D interativa — acessível em celular e desktop.
      </p>

      <RubiksCube3D />

      <div className="mt-4 text-sm text-muted-foreground">
        Se quiser, posso adicionar leaderboard, compartilhamento de scramble ou
        tutorial.
      </div>
    </div>
  )
}
