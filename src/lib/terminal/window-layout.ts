/**
 * Geometria do gerenciador de janelas do terminal web.
 *
 * Retângulos são FRAÇÕES da área de trabalho (0..1), não pixels: o layout
 * salvo continua fazendo sentido se a janela do navegador mudar de tamanho.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type SnapZone =
  | 'maximize'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface WindowState {
  /** nome da sessão tmux, ou `shell-N` quando o host não tem tmux */
  id: string
  session: string | null
  rect: Rect
  maximized: boolean
  minimized: boolean
  z: number
}

/** Tamanho mínimo em pixels (abaixo disso o xterm fica inutilizável). */
export const MIN_W_PX = 320
export const MIN_H_PX = 180
/** Distância da borda (px) que ativa o snap ao arrastar. */
const EDGE_PX = 16
/** Tamanho das zonas de canto (px) para snap em quartos. */
const CORNER_PX = 64

export const ZONE_RECTS: Record<SnapZone, Rect> = {
  maximize: { x: 0, y: 0, w: 1, h: 1 },
  left: { x: 0, y: 0, w: 0.5, h: 1 },
  right: { x: 0.5, y: 0, w: 0.5, h: 1 },
  'top-left': { x: 0, y: 0, w: 0.5, h: 0.5 },
  'top-right': { x: 0.5, y: 0, w: 0.5, h: 0.5 },
  'bottom-left': { x: 0, y: 0.5, w: 0.5, h: 0.5 },
  'bottom-right': { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
}

/** Zona de snap para o ponteiro em (px, py) dentro de uma área w×h. */
export function snapZoneAt(
  px: number,
  py: number,
  width: number,
  height: number,
): SnapZone | null {
  const nearLeft = px <= EDGE_PX
  const nearRight = px >= width - EDGE_PX
  const nearTop = py <= EDGE_PX
  const nearBottom = py >= height - EDGE_PX
  const inTopBand = py <= CORNER_PX
  const inBottomBand = py >= height - CORNER_PX
  const inLeftBand = px <= CORNER_PX
  const inRightBand = px >= width - CORNER_PX

  if ((nearLeft && inTopBand) || (nearTop && inLeftBand)) return 'top-left'
  if ((nearRight && inTopBand) || (nearTop && inRightBand)) return 'top-right'
  if ((nearLeft && inBottomBand) || (nearBottom && inLeftBand)) {
    return 'bottom-left'
  }
  if ((nearRight && inBottomBand) || (nearBottom && inRightBand)) {
    return 'bottom-right'
  }
  if (nearTop) return 'maximize'
  if (nearLeft) return 'left'
  if (nearRight) return 'right'
  return null
}

/** Mantém o retângulo dentro da área e acima do tamanho mínimo. */
export function clampRect(r: Rect, width: number, height: number): Rect {
  const minW = Math.min(1, MIN_W_PX / Math.max(width, 1))
  const minH = Math.min(1, MIN_H_PX / Math.max(height, 1))
  const w = Math.min(1, Math.max(minW, r.w))
  const h = Math.min(1, Math.max(minH, r.h))
  return {
    w,
    h,
    x: Math.min(1 - w, Math.max(0, r.x)),
    y: Math.min(1 - h, Math.max(0, r.y)),
  }
}

/** Grade quase quadrada: 1 → cheia, 2 → metades, 3-4 → 2×2, 5-6 → 3×2... */
export function tileRects(n: number): Rect[] {
  if (n <= 0) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const rects: Rect[] = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols)
    // A última linha estica as janelas para não sobrar buraco
    const inRow = row === rows - 1 ? n - cols * (rows - 1) : cols
    const col = i - row * cols
    rects.push({ x: col / inRow, y: row / rows, w: 1 / inRow, h: 1 / rows })
  }
  return rects
}

export function cascadeRects(n: number): Rect[] {
  const step = 0.04
  const w = 0.6
  const h = 0.6
  const max = Math.floor((1 - w) / step)
  return Array.from({ length: n }, (_, i) => {
    const k = i % (max + 1)
    return { x: k * step, y: k * step, w, h }
  })
}

/** Posição de uma janela nova: cascata a partir das que já existem. */
export function nextWindowRect(existing: number): Rect {
  return cascadeRects(existing + 1)[existing]
}

// ------------------------------------------------------------ persistência

const STORAGE_PREFIX = 'webdeck:layout:v1:'

interface StoredLayout {
  windows: Omit<WindowState, 'z'>[]
}

export function loadLayout(connectionKey: string): WindowState[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + connectionKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredLayout
    if (!Array.isArray(parsed?.windows)) return []
    return parsed.windows
      .filter(
        (w) =>
          typeof w?.id === 'string' &&
          w.rect &&
          [w.rect.x, w.rect.y, w.rect.w, w.rect.h].every(
            (v) => typeof v === 'number' && v >= 0 && v <= 1,
          ),
      )
      .map((w, i) => ({
        id: w.id,
        session: typeof w.session === 'string' ? w.session : null,
        rect: w.rect,
        maximized: Boolean(w.maximized),
        minimized: Boolean(w.minimized),
        z: i + 1,
      }))
  } catch {
    return []
  }
}

export function saveLayout(connectionKey: string, windows: WindowState[]) {
  try {
    const ordered = [...windows].sort((a, b) => a.z - b.z)
    const data: StoredLayout = {
      // Shells sem tmux não sobrevivem à reconexão: não vale salvar
      windows: ordered
        .filter((w) => w.session)
        .map(({ id, session, rect, maximized, minimized }) => ({
          id,
          session,
          rect,
          maximized,
          minimized,
        })),
    }
    window.localStorage.setItem(
      STORAGE_PREFIX + connectionKey,
      JSON.stringify(data),
    )
  } catch {
    // modo privado / storage bloqueado: só não persiste
  }
}
