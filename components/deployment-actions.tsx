'use client'

import { useEffect, useTransition } from 'react'
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteDeployment, refreshDeployments, restartDeployment } from '@/app/actions/deploy'

export function RefreshButton({ auto }: { auto: boolean }) {
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => start(() => refreshDeployments()), 15000)
    return () => clearInterval(timer)
  }, [auto])

  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      onClick={() => start(() => refreshDeployments())}
      disabled={pending}
    >
      <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
      {auto ? 'Checking status' : 'Refresh'}
    </button>
  )
}

export function DeploymentActions({ id, canRestart }: { id: number; canRestart: boolean }) {
  const [pending, start] = useTransition()

  return (
    <>
      {canRestart && (
        <button
          type="button"
          className="btn-outline btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await restartDeployment(id)
              if (res?.error) toast.error(res.error)
              else toast.success(res?.success ?? 'Restarted')
            })
          }
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Restart
        </button>
      )}
      <button
        type="button"
        className="btn-danger btn-sm"
        disabled={pending}
        onClick={() => {
          if (!confirm('Delete this bot and its Heroku app? This cannot be undone.')) return
          start(async () => {
            const res = await deleteDeployment(id)
            if (res?.error) toast.error(res.error)
            else toast.success(res?.success ?? 'Deleted')
          })
        }}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Delete</span>
      </button>
    </>
  )
}
