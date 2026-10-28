import { Coins } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { DeploymentList } from '@/components/deployment-list'
import { TemplateCard } from '@/components/template-card'
import { syncUserDeployments } from '@/app/actions/deploy'
import { getActiveTemplates, getUserDeployments } from '@/lib/queries'
import { requireViewer } from '@/lib/session'

export default async function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  const viewer = await requireViewer()
  const { deployed } = await searchParams
  await syncUserDeployments(viewer.id)
  const [templates, deployments] = await Promise.all([getActiveTemplates(), getUserDeployments(viewer.id)])

  return (
    <>
      <SiteHeader viewer={viewer} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-balance">Hi {viewer.name.split(' ')[0]}, manage your bots</h1>
          </div>
          <div className="card flex items-center gap-3 px-4 py-3">
            <Coins className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Coin balance</p>
              <p className="font-mono text-lg font-semibold">{viewer.coins}</p>
            </div>
          </div>
        </section>

        {deployed && (
          <p role="status" className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            Deployment started. Heroku is building your bot — status updates automatically.
          </p>
        )}

        <DeploymentList rows={deployments} />

        <section aria-labelledby="templates" className="flex flex-col gap-4">
          <h2 id="templates" className="text-lg font-semibold">
            Bot templates
          </h2>
          {templates.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted-foreground">
              No bot templates published yet. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} href={`/dashboard/deploy/${t.id}`} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
