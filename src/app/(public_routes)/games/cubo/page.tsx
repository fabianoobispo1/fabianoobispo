import React from 'react'
import RubiksCube3D from '@/components/games/RubiksCube3D'

export const metadata = {
  title: 'Cubo Mágico - Jogos',
  description: 'Jogue cubo mágico 3D interativo',
}

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cubo Mágico</h1>
      <p className="mb-4 text-sm text-muted-foreground">Versão 3D interativa — acessível em celular e desktop.</p>

      <RubiksCube3D />

      <div className="mt-4 text-sm text-muted-foreground">Se quiser, posso adicionar leaderboard, compartilhamento de scramble ou tutorial.</div>
    </div>
  )
}
