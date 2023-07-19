export type Item = {
  name: string
  slug: string
  description?: string
}

export const demos: { name: string; items: Item[] }[] = [
  {
    name: 'Pagiana teste',
    items: [
      {
        name: 'Pagina teste 01',
        slug: 'paginateste01',
        description: 'Descricao',
      },
    ],
  },
  {
    name: 'Paginas teste',
    items: [
      {
        name: 'Pagina teste 02',
        slug: 'paginateste02',
        description: 'Descricao',
      },
      {
        name: 'Pagina teste 03',
        slug: 'paginateste03',
        description: 'Descricao',
      },
    ],
  },
]
