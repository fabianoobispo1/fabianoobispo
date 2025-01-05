'use client'

import ConfirmacaoSeletiva from './emailTemplates/email-confirmacao-seletiva'

export function TesteDeEmail() {
  return (
    <div className="space-y-8">
      <ConfirmacaoSeletiva />
    </div>
  )
}
