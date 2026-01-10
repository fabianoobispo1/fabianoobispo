import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'

import { DashboardOverview } from './_components/dashboard-overview'

export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard 📊</h2>
            <p className="text-muted-foreground">
              Visão geral das suas atividades
            </p>
          </div>
        </div>
        <DashboardOverview />
      </div>
    </ScrollArea>
  )
}
