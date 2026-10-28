import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { ArrowLeft, Github } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { DeployForm } from '@/components/deploy-form'
import { BotImage, repoLabel } from '@/components/template-card'
import { db } from '@/lib/db'
import { botTemplate } from '@/lib/db/schema'
import { requireViewer } from '@/lib/session'

export default async function DeployPage({ params }: PageProps<'/dashboard/deploy/[id]'>) {
  const viewer = await requireViewer()
  const { id } = await params
  const templateId = Number.parseInt(id, 10)
  if (!Number.isInteger(templateId)) notFound()

  const [template] = await db
    .select()
    .from(botTemplate)
    .where(and(eq(botTemplate.id, templateId), eq(botTemplate.active, true)))
  if (!template) notFound()

  return (
    <>
      <SiteHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link href="/dashboard" className="btn-ghost btn-sm -ml-3">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>
        <div className="mt-4 grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="flex flex-col gap-3">
            <BotImage src={template.imageUrl} alt={`${template.name} bot`} />
            <h1 className="text-xl font-semibold">{template.name}</h1>
            {template.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
            )}
            <a
              href={template.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary"
            >
              <Github className="size-3.5" aria-hidden="true" />
              {repoLabel(template.repoUrl)}
            </a>
          </aside>
          <div className="card p-5">
            <DeployForm
              templateId={template.id}
              pairLink={template.pairLink}
              sessionEnvKey={template.sessionEnvKey}
              cost={template.cost}
              balance={viewer.coins}
            />
          </div>
        </div>
      </main>
    </>
  )
}
