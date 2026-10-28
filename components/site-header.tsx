import Link from 'next/link'
import { Coins, Server } from 'lucide-react'
import type { Viewer } from '@/lib/session'
import { SignOutButton } from '@/components/sign-out-button'

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Server className="size-4" aria-hidden="true" />
      </span>
      <span>
        NEXUS <span className="text-primary">HOST</span>
      </span>
    </Link>
  )
}

export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  const staff = viewer && (viewer.role === 'admin' || viewer.role === 'subadmin')
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Brand />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {viewer ? (
            <>
              <Link href="/dashboard" className="btn-ghost btn-sm">
                Dashboard
              </Link>
              {staff && (
                <Link href="/admin" className="btn-ghost btn-sm">
                  Admin
                </Link>
              )}
              <span
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-xs"
                title="Your coin balance"
              >
                <Coins className="size-3.5 text-primary" aria-hidden="true" />
                {viewer.coins}
                <span className="sr-only">coins</span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
