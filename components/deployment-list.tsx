import { ExternalLink } from 'lucide-react'
import { DeploymentActions, RefreshButton } from '@/components/deployment-actions'

export type DeploymentRow = {
  id: number
  appName: string
  status: string
  appUrl: string | null
  error: string | null
  cost: number
  createdAt: Date
  templateName: string | null
}

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-primary/15 text-primary',
  building: 'bg-amber-400/15 text-amber-300',
  pending: 'bg-amber-400/15 text-amber-300',
  failed: 'bg-destructive/15 text-destructive',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-xs capitalize ${STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

export function DeploymentList({ rows }: { rows: DeploymentRow[] }) {
  const hasBuilding = rows.some((r) => r.status === 'building' || r.status === 'pending')

  return (
    <section aria-labelledby="my-bots" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="my-bots" className="text-lg font-semibold">
          My bots
        </h2>
        <RefreshButton auto={hasBuilding} />
      </div>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted-foreground">
          No bots yet. Pick a template below to deploy your first WhatsApp bot.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((d) => (
            <li key={d.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-mono text-sm font-medium">{d.appName}</span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.templateName ?? 'Deleted template'} · {d.createdAt.toLocaleDateString()}
                </p>
                {d.status === 'failed' && d.error && (
                  <p className="mt-1 text-xs text-destructive">{d.error}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.appUrl && (
                  <a href={d.appUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
                    Open
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
                <DeploymentActions id={d.id} canRestart={d.status === 'running'} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
