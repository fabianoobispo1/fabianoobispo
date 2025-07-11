import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle'

import PageNameDontpad from './page-name-dontpad-form'

export default function Dontpad() {
  return (
    <div className="relative h-screen flex-col items-center justify-center ">
      <div className="absolute right-4 top-4 md:right-8 md:top-8 flex gap-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center h-full w-full">
        <Card className="w-[350px] ">
          <CardHeader>
            <CardTitle>Bloco ne notas</CardTitle>
            {/*  <CardDescription>Digite o nome da pagina</CardDescription> */}
          </CardHeader>
          <CardContent>
            <PageNameDontpad />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
