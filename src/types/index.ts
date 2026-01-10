import { type ClientUploadedFileData } from 'uploadthing/types'

import { Icons } from '@/components/icons'
import type { Id } from '@/convex/_generated/dataModel'

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>

export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
  label?: string
  description?: string
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[]
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[]
}

export interface FooterItem {
  title: string
  items: {
    title: string
    href: string
    external?: boolean
  }[]
}

export type MainNavItem = NavItemWithOptionalChildren

export type SidebarNavItem = NavItemWithChildren

// Transactions
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  DEPOSIT = 'DEPOSIT',
  INVESTMENT = 'INVESTMENT',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: 'Despesa',
  [TransactionType.DEPOSIT]: 'Receita',
  [TransactionType.INVESTMENT]: 'Investimento',
}

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'BANK_SLIP'
  | 'CASH'
  | 'PIX'
  | 'OTHER'

export const TransactionTypeLabels: Record<TransactionType, string> = {
  DEPOSIT: 'Entrada',
  EXPENSE: 'Despesa',
  INVESTMENT: 'Investimento',
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_TRANSFER: 'Transferência Bancária',
  BANK_SLIP: 'Boleto',
  CASH: 'Dinheiro',
  PIX: 'Pix',
  OTHER: 'Outro',
}

export const getTransactionTypeLabel = (type: TransactionType): string => {
  return TransactionTypeLabels[type]
}

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  return PaymentMethodLabels[method]
}

// ezemplo de uso
// const transactionType = 'DEPOSIT'
// const label = getTransactionTypeLabel(transactionType) // retorna 'Entrada'

export interface Transaction {
  _id: Id<'transactions'>
  name: string
  type: TransactionType
  amount: number
  category: string
  paymentMethod: PaymentMethod
  date: number
  created_at: number
  updated_at: number
  userId: Id<'user'>
}

export interface Category {
  _id: Id<'categories'>
  name: string
  type: string
  description?: string
  created_at: number
  updated_at: number
  active: boolean
}
