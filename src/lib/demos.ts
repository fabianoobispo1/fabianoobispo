export type Item = {
  name: string
  slug: string
  description?: string
}

export const demos: { key: number; name: string; items: Item[] }[] = [
  {
    key: 1,
    name: 'itens',
    items: [
      {
        name: 'Pagina 01',
        slug: 'megasena',
        description: 'Descricao',
      },
      {
        name: 'Pagina teste',
        slug: 'teste',
        description: 'Descricao',
      },
    ],
  },
  /*  {
    key: 2,
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
  }, */
]
