import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import PageNameDontpad from './page-name-dontpad-form'

export default async function Dontpad() {
  return (
    <div className="relative h-screen flex-col items-center justify-center ">
      <div className="flex items-center justify-center h-full w-full">
        <Card className="w-[350px] bg-white">
          <CardHeader>
            <CardTitle>Bloco ne notas</CardTitle>
            <CardDescription>Teste de sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <PageNameDontpad />
          </CardContent>
        </Card>

        {/*     
          <input
            type="text"
            placeholder="Digite o nome da página"
            className="border-2 border-gray-300 bg-white h-16 px-5 pr-16 text-lg rounded-l-md focus:outline-none border-r-0 max-md:w-4/6 max-md:text-sm max-md:p-0 max-md:pl-2 max-md:h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = document.querySelector('input')
                const value = input?.value
                if (value) {
                  window.location.href = `/${value}`
                }
              }
            }}
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-16 text-lg py-2 px-4 rounded-r-md max-md:w-12 max-md:h-10"
            onClick={() => {
              const input = document.querySelector('input')
              const value = input?.value
              if (value) {
                window.location.href = `/${value}`
              }
            }}
          >
            Ir
          </button>
      */}
      </div>
    </div>
  )
}
