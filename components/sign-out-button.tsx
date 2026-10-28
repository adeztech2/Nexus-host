'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      onClick={async () => {
        await authClient.signOut()
        router.push('/')
        router.refresh()
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only">Sign out</span>
    </button>
  )
}
