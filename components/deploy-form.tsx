'use client'

import { useActionState } from 'react'
import { ExternalLink, Rocket } from 'lucide-react'
import { deployBot } from '@/app/actions/deploy'

export function DeployForm({
  templateId,
  pairLink,
  sessionEnvKey,
  cost,
  balance,
}: {
  templateId: number
  pairLink: string | null
  sessionEnvKey: string
  cost: number
  balance: number
}) {
  const [state, action, pending] = useActionState(deployBot, undefined)
  const insufficient = balance < cost

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="templateId" value={templateId} />

      <div className="rounded-md border border-border bg-muted/50 p-4">
        <p className="eyebrow">Step 1</p>
        <p className="mt-1 text-sm font-medium">Pair your WhatsApp number</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Open the pair link, enter your number, link the device in WhatsApp, and copy the session ID it gives you.
        </p>
        {pairLink ? (
          <a href={pairLink} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm mt-3">
            Open pair link
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">No pair link provided for this bot.</p>
        )}
      </div>

      <div>
        <p className="eyebrow mb-3">Step 2</p>
        <label htmlFor="sessionId" className="label">
          Session ID <span className="font-mono">({sessionEnvKey})</span>
        </label>
        <textarea
          id="sessionId"
          name="sessionId"
          required
          rows={3}
          placeholder="Paste your session ID here"
          className="input font-mono text-xs"
        />
      </div>

      <div>
        <label htmlFor="appName" className="label">
          Heroku app name
        </label>
        <input
          id="appName"
          name="appName"
          required
          pattern="[a-z][a-z0-9\-]{2,29}"
          placeholder="my-whatsapp-bot"
          className="input font-mono"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">Lowercase letters, numbers and dashes. Must be unique on Heroku.</p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">
          Cost: <span className="font-mono text-foreground">{cost}</span> · Balance:{' '}
          <span className={`font-mono ${insufficient ? 'text-destructive' : 'text-foreground'}`}>{balance}</span>
        </span>
        <button type="submit" className="btn-primary" disabled={pending || insufficient}>
          <Rocket className="size-4" aria-hidden="true" />
          {pending ? 'Deploying...' : 'Deploy'}
        </button>
      </div>
      {insufficient && (
        <p className="text-xs text-muted-foreground">You need more coins. Ask an admin to top up your balance.</p>
      )}
    </form>
  )
}
