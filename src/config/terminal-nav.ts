/**
 * Configuração do menu de navegação para Terminal SSH
 *
 * Adicione este item ao seu menu de navegação principal
 */

import { Monitor } from 'lucide-react'

export const terminalNavItem = {
  title: 'Terminal SSH',
  href: '/dashboard/terminal',
  icon: Monitor,
  description: 'Acesso remoto seguro ao VPS',
  isNew: true,
  requiredRole: 'admin', // opcional: restringir por role
}

/**
 * Exemplo de como adicionar ao menu (adapte conforme sua estrutura):
 *
 * import { terminalNavItem } from '@/config/terminal-nav'
 *
 * export const dashboardItems = [
 *   {
 *     title: 'Dashboard',
 *     href: '/dashboard',
 *   },
 *   // ... outros items
 *   terminalNavItem, // Adicione aqui
 * ]
 */
