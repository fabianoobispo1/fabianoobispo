import { PixPayment } from '@/components/PixPayment'

export default function Page() {
  return (
    <div className="relative h-screen flex-col items-center justify-center ">
      <PixPayment amount={100} description="Teste de pagamento Pix" />
    </div>
  )
}
