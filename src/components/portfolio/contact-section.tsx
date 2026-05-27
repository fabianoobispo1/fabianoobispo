'use client'

import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react'

export function ContactSection() {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'fbc623@gmail.com',
      href: 'mailto:fbc623@gmail.com',
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: 'Brasil',
      href: null,
    },
    {
      icon: Phone,
      title: 'Disponibilidade',
      value: 'Aberto a propostas',
      href: null,
    },
  ]

  return (
    <section id="contato" className="bg-brand-forest-2 py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-brand-cream sm:text-4xl md:text-5xl">
            Vamos Trabalhar Juntos?
          </h2>
          <p className="mt-4 text-brand-mute">
            Estou disponível para novos projetos e oportunidades. Entre em
            contato e vamos criar algo incrível!
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-lg border border-brand-forest-3 bg-brand-forest p-6 text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-emerald/10">
                <info.icon className="h-6 w-6 text-brand-emerald" />
              </div>
              <h3 className="mb-1 font-semibold text-brand-cream">
                {info.title}
              </h3>
              {info.href ? (
                <a
                  href={info.href}
                  className="text-sm text-brand-mute hover:text-brand-emerald transition-colors hover:underline"
                >
                  {info.value}
                </a>
              ) : (
                <p className="text-sm text-brand-mute">{info.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://wa.me/5532991678449"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-brand-emerald/40 px-6 py-3 font-mono text-xs tracking-wider uppercase text-brand-emerald transition-colors hover:bg-brand-emerald hover:text-brand-forest"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
