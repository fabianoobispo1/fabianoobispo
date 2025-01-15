export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  {
    value: 'BANK_TRANSFER',
    label: 'Transferência Bancária',
  },
  {
    value: 'BANK_SLIP',
    label: 'Boleto',
  },
  {
    value: 'CASH',
    label: 'Dinheiro',
  },
  {
    value: 'CREDIT_CARD',
    label: 'Cartão de Crédito',
  },
  {
    value: 'DEBIT_CARD',
    label: 'Cartão de Débito',
  },
  {
    value: 'OTHER',
    label: 'Outros',
  },
  {
    value: 'PIX',
    label: 'Pix',
  },
]

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  CREDIT_CARD: 'credit-card.svg',
  DEBIT_CARD: 'debit-card.svg',
  BANK_TRANSFER: 'bank-transfer.svg',
  BANK_SLIP: 'bank-slip.svg',
  CASH: 'money.svg',
  PIX: 'pix.svg',
  OTHER: 'other.svg',
}
