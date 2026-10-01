export type Lang = 'fr' | 'en'

export type SectionType =
  | 'hero'
  | 'about'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'contact'

/** Localized payload: each section stores its fields per language. */
export type LangBlock = Record<string, unknown>

export interface Section {
  id: string
  type: SectionType
  enabled: boolean
  order: number
  content: Record<Lang, LangBlock>
}

export interface Settings {
  name: string
  defaultLang: Lang
  tagline?: Record<Lang, string>
}

export interface Content {
  settings: Settings
  sections: Section[]
}

/* ---- Per-type field shapes (what each LangBlock holds) ---- */

export interface HeroBlock {
  title: string
  subtitle: string
  ctaLabel: string
}

export interface AboutBlock {
  heading: string
  body: string
}

export interface SkillGroup {
  group: string
  items: string[]
}
export interface SkillsBlock {
  heading: string
  groups: SkillGroup[]
}

export interface ExperienceItem {
  role: string
  company: string
  period: string
  description: string
  stack?: string[]
}
export interface ExperienceBlock {
  heading: string
  items: ExperienceItem[]
}

export interface ProjectItem {
  name: string
  description: string
  link?: string
  stack?: string[]
}
export interface ProjectsBlock {
  heading: string
  items: ProjectItem[]
}

export interface EducationItem {
  degree: string
  school: string
  period: string
}
export interface EducationBlock {
  heading: string
  items: EducationItem[]
}

export interface ContactBlock {
  heading: string
  email: string
  phone?: string
  location?: string
  github?: string
  linkedin?: string
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  about: 'À propos',
  skills: 'Compétences',
  experience: 'Expérience',
  projects: 'Projets',
  education: 'Formation',
  contact: 'Contact',
}
