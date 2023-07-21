export type Item = {
  name: string
  slug: string
  description?: string
}

export const demos: { name: string; items: Item[] }[] = [
  {
    name: 'itens',
    items: [
      {
        name: 'Sub Iten 01',
        slug: 'paginateste01',
        description: 'Descricao',
      },
    ],
  },
  {
    name: 'itens',
    items: [
      {
        name: 'Sub Iten 01',
        slug: 'paginateste02',
        description: 'Descricao',
      },
      {
        name: 'Sub Iten 02',
        slug: 'paginateste03',
        description: 'Descricao',
      },
    ],
  },
]
