import Link from 'next/link'
import { Coins, Github } from 'lucide-react'
import type { BotTemplate } from '@/lib/db/schema'

export function BotImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin-supplied images come from arbitrary hosts
    <img
      src={src || '/images/bot-default.png'}
      alt={alt}
      className={`aspect-square w-full rounded-md border border-border bg-muted object-cover ${className}`}
    />
  )
}

export function repoLabel(url: string) {
  return url.replace(/^https:\/\/github\.com\//i, '')
}

export function TemplateCard({ template, href }: { template: BotTemplate; href: string }) {
  return (
    <article className="card flex flex-col overflow-hidden p-4 transition-colors hover:border-primary/50">
      <BotImage src={template.imageUrl} alt={`${template.name} bot`} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-balance">{template.name}</h3>
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
          <Coins className="size-3" aria-hidden="true" />
          {template.cost === 0 ? 'Free' : template.cost}
        </span>
      </div>
      {template.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{template.description}</p>
      )}
      <p className="mt-3 flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
        <Github className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{repoLabel(template.repoUrl)}</span>
      </p>
      <Link href={href} className="btn-primary mt-4 w-full">
        Deploy bot
      </Link>
    </article>
  )
}
