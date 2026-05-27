'use client'

export function SkillsSection() {
  const skillCategories = [
    {
      title: 'Frontend',
      skills: [
        'React',
        'Next.js 15',
        'TypeScript',
        'Tailwind CSS',
        'Shadcn/ui',
        'React Hook Form',
        'Zod',
        'Chart.js',
        'Recharts',
      ],
    },
    {
      title: 'Backend',
      skills: [
        'Convex',
        'Node.js',
        'NextAuth',
        'API REST',
        'Webhooks',
        'Real-time',
      ],
    },
    {
      title: 'Ferramentas & Outros',
      skills: [
        'Git & GitHub',
        'Vercel',
        'ESLint',
        'Prettier',
        'Uploadthing',
        'Resend',
        'jsPDF',
      ],
    },
    {
      title: 'Conceitos',
      skills: [
        'Server Components',
        'Authentication',
        'Real-time Apps',
        'Responsive Design',
        'TypeScript First',
        'Clean Code',
      ],
    },
  ]

  return (
    <section id="skills" className="bg-brand-forest-2 py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-brand-cream sm:text-4xl md:text-5xl">
            Tecnologias & Habilidades
          </h2>
          <p className="mt-4 text-brand-mute">
            Stack moderna e ferramentas que utilizo para criar aplicações de
            alta qualidade.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {skillCategories.map((category, index) => (
            <div
              key={index}
              className="rounded-lg border border-brand-forest-3 bg-brand-forest p-6"
            >
              <h3 className="mb-4 font-mono text-xs tracking-wider text-brand-cream uppercase">
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="rounded border border-brand-forest-3 px-2 py-0.5 font-mono text-xs text-brand-cream/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
