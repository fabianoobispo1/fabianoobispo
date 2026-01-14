'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

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
const step = size + gap

function CameraWatcher({ setHigh }: { setHigh: (v: boolean) => void }) {
  const lastRef = useRef<boolean | null>(null)
  const { camera } = useThree()
  useFrame(() => {
    const dist = camera.position.length()
    const isHigh = dist < 8
    if (lastRef.current !== isHigh) {
      lastRef.current = isHigh
      setHigh(isHigh)
    }
  })
  return null
}

function HighDetail({ cubies }: { cubies: Cubie[] }) {
  const instRef = useRef<THREE.InstancedMesh | null>(null)
  const temp = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!instRef.current) return
    cubies.forEach((c, i) => {
      temp.position.set(c.pos[0] * step, c.pos[1] * step, c.pos[2] * step)
      temp.updateMatrix()
      instRef.current!.setMatrixAt(i, temp.matrix)
    })
    instRef.current.instanceMatrix.needsUpdate = true
  }, [cubies, temp])

  return (
    <>
      <instancedMesh ref={instRef} args={[undefined, undefined, cubies.length]}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#111827" />
      </instancedMesh>

      {cubies.map((c) => (
        <group
          key={c.id}
          position={[c.pos[0] * step, c.pos[1] * step, c.pos[2] * step]}
        >
          {c.faces.U && (
            <mesh
              position={[0, size / 2 + 0.001, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.U} />
            </mesh>
          )}
          {c.faces.D && (
            <mesh
              position={[0, -size / 2 - 0.001, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.D} />
            </mesh>
          )}
          {c.faces.F && (
            <mesh position={[0, 0, size / 2 + 0.001]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.F} />
            </mesh>
          )}
          {c.faces.B && (
            <mesh
              position={[0, 0, -size / 2 - 0.001]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.B} />
            </mesh>
          )}
          {c.faces.R && (
            <mesh
              position={[size / 2 + 0.001, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.R} />
            </mesh>
          )}
          {c.faces.L && (
            <mesh
              position={[-size / 2 - 0.001, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={c.faces.L} />
            </mesh>
          )}
        </group>
      ))}
    </>
  )
}

function LowDetail() {
  const sizeAll = size * 3 + gap * 2
  return (
    <mesh>
      <boxGeometry args={[sizeAll, sizeAll, sizeAll]} />
      <meshStandardMaterial color="#111827" />
    </mesh>
  )
}

export default function RubiksCube3DCanvas({ cubies }: { cubies: Cubie[] }) {
  const [highDetail, setHighDetail] = React.useState(true)

  return (
    <Canvas camera={{ position: [5, 5, 6], fov: 50 }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <CameraWatcher setHigh={setHighDetail} />
      <group position={[0, 0, 0]}>
        {highDetail ? <HighDetail cubies={cubies} /> : <LowDetail />}
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        makeDefault
      />
    </Canvas>
  )
}
