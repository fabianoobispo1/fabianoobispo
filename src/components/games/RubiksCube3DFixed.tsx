'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

type Vec3 = [number, number, number]

type Faces = {
  U?: string
  D?: string
  L?: string
  R?: string
  F?: string
  B?: string
}

type Cubie = {
  id: string
  pos: Vec3
  faces: Faces
}

const size = 0.9
const gap = 0.06
export const step = size + gap

function faceColorDefaults(): Faces {
  return {
    U: '#ffffff',
    D: '#ffff00',
    F: '#00a800',
    B: '#0055ff',
    R: '#ff0000',
    L: '#ff8c00',
  }
}

function createSolvedCubies(): Cubie[] {
  const cubies: Cubie[] = []
  let id = 0
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const faces: Faces = {}
        const defaults = faceColorDefaults()
        if (y === 1) faces.U = defaults.U
        if (y === -1) faces.D = defaults.D
        if (z === 1) faces.F = defaults.F
        if (z === -1) faces.B = defaults.B
        if (x === 1) faces.R = defaults.R
        if (x === -1) faces.L = defaults.L
        cubies.push({ id: `${id++}`, pos: [x, y, z], faces })
      }
    }
  }
  return cubies
}

// Importação dinâmica do Canvas 3D
const ThreeCanvas = dynamic(() => import('./RubiksCube3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p>Carregando visualização 3D...</p>
    </div>
  ),
})

export default function RubiksCube3D() {
  const [cubies, setCubies] = useState<Cubie[]>(() => createSolvedCubies())
  const [moves, setMoves] = useState(0)
  const [running, setRunning] = useState(false)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let raf: number
    if (running && startAt) {
      const tick = () => {
        setTime(Math.floor((Date.now() - startAt) / 1000))
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(raf)
  }, [running, startAt])

  function reset() {
    setCubies(createSolvedCubies())
    setMoves(0)
    setRunning(false)
    setStartAt(null)
    setTime(0)
  }

  function startTimer() {
    if (!running) {
      setStartAt(Date.now() - time * 1000)
      setRunning(true)
    }
  }

  function stopTimer() {
    setRunning(false)
  }

  function scramble(times = 20) {
    const movesList = [
      'U',
      "U'",
      'D',
      "D'",
      'L',
      "L'",
      'R',
      "R'",
      'F',
      "F'",
      'B',
      "B'",
    ]
    let newCubies = cubies.slice()
    for (let i = 0; i < times; i++) {
      const mv = movesList[Math.floor(Math.random() * movesList.length)]
      newCubies = applyMove(newCubies, mv)
    }
    setCubies(newCubies)
    setMoves((m) => m + times)
    setRunning(true)
    setStartAt((prev) => prev ?? Date.now())
  }

  function applyMove(state: Cubie[], move: string) {
    const clockwise = !move.includes("'")
    const face = move.replace("'", '') as 'U' | 'D' | 'L' | 'R' | 'F' | 'B'
    const axisMap: Record<string, 'x' | 'y' | 'z'> = {
      U: 'y',
      D: 'y',
      L: 'x',
      R: 'x',
      F: 'z',
      B: 'z',
    }
    const indexMap: Record<string, number> = {
      U: 1,
      D: -1,
      L: -1,
      R: 1,
      F: 1,
      B: -1,
    }
    const axis = axisMap[face]
    const index = indexMap[face]

    const newState = state.map((c) => ({
      ...c,
      pos: [...c.pos] as Vec3,
      faces: { ...c.faces },
    }))
    const toRotate = newState.filter((c) => {
      const p = c.pos
      return axis === 'x'
        ? p[0] === index
        : axis === 'y'
          ? p[1] === index
          : p[2] === index
    })

    const rotatePos = (p: Vec3) => {
      const [x, y, z] = p
      if (axis === 'x') {
        return clockwise ? ([x, -z, y] as Vec3) : ([x, z, -y] as Vec3)
      }
      if (axis === 'y') {
        return clockwise ? ([z, y, -x] as Vec3) : ([-z, y, x] as Vec3)
      }
      return clockwise ? ([-y, x, z] as Vec3) : ([y, -x, z] as Vec3)
    }

    const faceCycle: Record<string, string[]> = {
      x: ['U', 'B', 'D', 'F'],
      y: ['F', 'R', 'B', 'L'],
      z: ['U', 'R', 'D', 'L'],
    }

    toRotate.forEach((c) => {
      c.pos = rotatePos(c.pos)
      const cycle = faceCycle[axis]
      const oldFaces = { ...c.faces }
      cycle.forEach((f, i) => {
        const from = cycle[(i + (clockwise ? 3 : 1)) % 4] as keyof Faces
        c.faces[f as keyof Faces] = oldFaces[from] as string | undefined
      })
    })

    const others = newState.filter((c) => !toRotate.some((t) => t.id === c.id))
    const merged = [...others, ...toRotate]
    return merged
  }

  return (
    <div className="w-full h-[80vh] md:h-[70vh] relative bg-slate-900/20 rounded-lg overflow-hidden">
      <ThreeCanvas cubies={cubies} />

      {/* overlay UI */}
      <div className="absolute left-2 top-2 flex flex-col gap-2">
        <div className="bg-white/90 text-black rounded-md p-2 text-sm flex gap-2 items-center">
          <button
            aria-label="Iniciar timer"
            className="px-2 py-1 rounded bg-green-500 text-white"
            onClick={startTimer}
          >
            Iniciar
          </button>
          <button
            aria-label="Parar timer"
            className="px-2 py-1 rounded bg-yellow-500 text-black"
            onClick={stopTimer}
          >
            Parar
          </button>
          <button
            aria-label="Resetar"
            className="px-2 py-1 rounded bg-red-500 text-white"
            onClick={reset}
          >
            Reset
          </button>
        </div>

        <div className="bg-white/90 text-black rounded-md p-2 text-sm">
          <div>Tempo: {time}s</div>
          <div>Movimentos: {moves}</div>
        </div>

        <div className="bg-white/90 text-black rounded-md p-2 text-sm">
          <div className="flex flex-wrap gap-2">
            {[
              'U',
              "U'",
              'D',
              "D'",
              'L',
              "L'",
              'R',
              "R'",
              'F',
              "F'",
              'B',
              "B'",
            ].map((m) => (
              <button
                key={m}
                aria-label={`Movimento ${m}`}
                className="px-2 py-1 rounded bg-slate-700 text-white text-xs"
                onClick={() => {
                  setCubies((s) => applyMove(s, m))
                  setMoves((c) => c + 1)
                  setRunning(true)
                  setStartAt((p) => p ?? Date.now())
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/90 text-black rounded-md p-2 text-sm flex gap-2">
          <button
            aria-label="Embaralhar"
            className="px-2 py-1 rounded bg-indigo-600 text-white"
            onClick={() => scramble(25)}
          >
            Embaralhar
          </button>
          <button
            aria-label="Solução (reset)"
            className="px-2 py-1 rounded bg-gray-600 text-white"
            onClick={reset}
          >
            Solução
          </button>
        </div>
      </div>

      {/* mobile controls bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:hidden flex gap-2">
        <div className="bg-white/95 p-2 rounded-md flex gap-1">
          {['U', 'D', 'L', 'R', 'F', 'B'].map((m) => (
            <button
              key={m}
              aria-label={`Movimento ${m}`}
              className="w-10 h-10 rounded-md bg-slate-800 text-white"
              onClick={() => {
                setCubies((s) => applyMove(s, m))
                setMoves((c) => c + 1)
                setRunning(true)
                setStartAt((p) => p ?? Date.now())
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* accessibility hint */}
      <div className="absolute right-2 bottom-2 bg-white/90 p-2 rounded text-sm">
        <div>
          Toque e arraste para rotacionar o cubo. Use os botões para girar
          camadas.
        </div>
      </div>
    </div>
  )
}
