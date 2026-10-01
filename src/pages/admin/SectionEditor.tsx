import type {
  AboutBlock,
  ContactBlock,
  EducationBlock,
  ExperienceBlock,
  HeroBlock,
  Lang,
  LangBlock,
  ProjectsBlock,
  Section,
  SkillsBlock,
} from '../../lib/types'
import { ArrayEditor, TagList, Text } from './fields'

export default function SectionEditor({
  section,
  lang,
  onChange,
}: {
  section: Section
  lang: Lang
  onChange: (block: LangBlock) => void
}) {
  const block = (section.content[lang] ?? {}) as LangBlock
  const set = (patch: Record<string, unknown>) => onChange({ ...block, ...patch })

  switch (section.type) {
    case 'hero': {
      const b = block as unknown as HeroBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.title ?? ''} onChange={(v) => set({ title: v })} />
          <Text label="Sous-titre" value={b.subtitle ?? ''} onChange={(v) => set({ subtitle: v })} textarea />
          <Text label="Libellé du bouton" value={b.ctaLabel ?? ''} onChange={(v) => set({ ctaLabel: v })} />
        </div>
      )
    }
    case 'about': {
      const b = block as unknown as AboutBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <Text label="Texte" value={b.body ?? ''} onChange={(v) => set({ body: v })} textarea />
        </div>
      )
    }
    case 'skills': {
      const b = block as unknown as SkillsBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <ArrayEditor
            label="Groupes"
            items={b.groups ?? []}
            onChange={(groups) => set({ groups })}
            blank={() => ({ group: '', items: [] })}
            render={(g, update) => (
              <>
                <Text label="Nom du groupe" value={g.group} onChange={(v) => update({ group: v })} />
                <TagList label="Compétences" value={g.items} onChange={(items) => update({ items })} />
              </>
            )}
          />
        </div>
      )
    }
    case 'experience': {
      const b = block as unknown as ExperienceBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <ArrayEditor
            label="Expériences"
            items={b.items ?? []}
            onChange={(items) => set({ items })}
            blank={() => ({ role: '', company: '', period: '', description: '', stack: [] })}
            render={(it, update) => (
              <>
                <Text label="Poste" value={it.role} onChange={(v) => update({ role: v })} />
                <Text label="Entreprise" value={it.company} onChange={(v) => update({ company: v })} />
                <Text label="Période" value={it.period} onChange={(v) => update({ period: v })} />
                <Text label="Description" value={it.description} onChange={(v) => update({ description: v })} textarea />
                <TagList label="Stack" value={it.stack ?? []} onChange={(stack) => update({ stack })} />
              </>
            )}
          />
        </div>
      )
    }
    case 'projects': {
      const b = block as unknown as ProjectsBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <ArrayEditor
            label="Projets"
            items={b.items ?? []}
            onChange={(items) => set({ items })}
            blank={() => ({ name: '', description: '', link: '', stack: [] })}
            render={(it, update) => (
              <>
                <Text label="Nom" value={it.name} onChange={(v) => update({ name: v })} />
                <Text label="Description" value={it.description} onChange={(v) => update({ description: v })} textarea />
                <Text label="Lien" value={it.link ?? ''} onChange={(v) => update({ link: v })} />
                <TagList label="Stack" value={it.stack ?? []} onChange={(stack) => update({ stack })} />
              </>
            )}
          />
        </div>
      )
    }
    case 'education': {
      const b = block as unknown as EducationBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <ArrayEditor
            label="Formations"
            items={b.items ?? []}
            onChange={(items) => set({ items })}
            blank={() => ({ degree: '', school: '', period: '' })}
            render={(it, update) => (
              <>
                <Text label="Diplôme" value={it.degree} onChange={(v) => update({ degree: v })} />
                <Text label="École" value={it.school} onChange={(v) => update({ school: v })} />
                <Text label="Période" value={it.period} onChange={(v) => update({ period: v })} />
              </>
            )}
          />
        </div>
      )
    }
    case 'contact': {
      const b = block as unknown as ContactBlock
      return (
        <div className="space-y-4">
          <Text label="Titre" value={b.heading ?? ''} onChange={(v) => set({ heading: v })} />
          <Text label="Email" value={b.email ?? ''} onChange={(v) => set({ email: v })} />
          <Text label="Téléphone" value={b.phone ?? ''} onChange={(v) => set({ phone: v })} />
          <Text label="Localisation" value={b.location ?? ''} onChange={(v) => set({ location: v })} />
          <Text label="GitHub" value={b.github ?? ''} onChange={(v) => set({ github: v })} />
          <Text label="LinkedIn" value={b.linkedin ?? ''} onChange={(v) => set({ linkedin: v })} />
        </div>
      )
    }
    default:
      return null
  }
}
