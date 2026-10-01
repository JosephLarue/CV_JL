import type {
  AboutBlock,
  ContactBlock,
  EducationBlock,
  ExperienceBlock,
  HeroBlock,
  Lang,
  ProjectsBlock,
  Section,
  SkillsBlock,
} from '../../lib/types'
import About from './About'
import Contact from './Contact'
import Education from './Education'
import Experience from './Experience'
import Hero from './Hero'
import Projects from './Projects'
import Skills from './Skills'

export default function SectionRenderer({
  section,
  lang,
  name,
}: {
  section: Section
  lang: Lang
  name: string
}) {
  const block = section.content[lang] ?? section.content.fr ?? {}

  switch (section.type) {
    case 'hero':
      return <Hero data={block as unknown as HeroBlock} name={name} />
    case 'about':
      return <About data={block as unknown as AboutBlock} />
    case 'skills':
      return <Skills data={block as unknown as SkillsBlock} />
    case 'experience':
      return <Experience data={block as unknown as ExperienceBlock} />
    case 'projects':
      return <Projects data={block as unknown as ProjectsBlock} />
    case 'education':
      return <Education data={block as unknown as EducationBlock} />
    case 'contact':
      return <Contact data={block as unknown as ContactBlock} />
    default:
      return null
  }
}
