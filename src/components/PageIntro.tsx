interface PageIntroProps {
  title: string
  subtitle: string
}

export function PageIntro({ title, subtitle }: PageIntroProps) {
  return (
    <header className="mb-5">
      <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-[#4a3d32]">{subtitle}</p>
    </header>
  )
}
