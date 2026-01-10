'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        'Stripe',
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
    <section id="skills" className="py-24 sm:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Tecnologias & Habilidades
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stack moderna e ferramentas que utilizo para criar aplicações de
            alta qualidade.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {skillCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <Badge
                      key={skillIndex}
                      variant="outline"
                      className="text-sm"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
