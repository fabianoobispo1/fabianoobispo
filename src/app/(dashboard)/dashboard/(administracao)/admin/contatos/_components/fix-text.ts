// Corrige texto UTF-8 que foi lido como Windows-1252/Latin-1 ("CristÃ³vÃ£o"
// -> "Cristóvão", "â€Ž" -> marca invisivel). So aplica quando o resultado
// decodifica sem erro; caso contrario devolve o original.

const CP1252: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  ƒ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  ˆ: 0x88,
  '‰': 0x89,
  Š: 0x8a,
  '‹': 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  š: 0x9a,
  '›': 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
}

const SUSPECT = /Ã.|â€|Â/
// zero-width / marcas direcionais (U+200B-200F, 202A-202E, 2066-2069)
const isInvisible = (c: number) =>
  (c >= 0x200b && c <= 0x200f) ||
  (c >= 0x202a && c <= 0x202e) ||
  (c >= 0x2066 && c <= 0x2069)
const stripInvisible = (s: string) =>
  Array.from(s)
    .filter((ch) => !isInvisible(ch.codePointAt(0)!))
    .join('')
const decoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { fatal: true })
    : null

export function fixMojibake(s: string): string {
  if (!s || !decoder || !SUSPECT.test(s)) return s
  const bytes: number[] = []
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    if (code < 0x100) bytes.push(code)
    else if (CP1252[ch] !== undefined) bytes.push(CP1252[ch])
    else return s
  }
  try {
    // remove marcas direcionais/zero-width que vem do WhatsApp
    return stripInvisible(decoder.decode(new Uint8Array(bytes)))
  } catch {
    return s
  }
}

export function formatPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4)
    const n = d.slice(4)
    return n.length === 9
      ? `+55 (${ddd}) ${n.slice(0, 5)}-${n.slice(5)}`
      : `+55 (${ddd}) ${n.slice(0, 4)}-${n.slice(4)}`
  }
  return raw
}
