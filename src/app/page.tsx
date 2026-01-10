import { Navbar } from '@/components/portfolio/navbar'
import { HeroSection } from '@/components/portfolio/hero-section'
import { AboutSection } from '@/components/portfolio/about-section'
import { ProjectsSection } from '@/components/portfolio/projects-section'
import { SkillsSection } from '@/components/portfolio/skills-section'
import { ContactSection } from '@/components/portfolio/contact-section'
import { Footer } from '@/components/portfolio/footer'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
