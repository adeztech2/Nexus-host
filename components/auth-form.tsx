'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setPending(false)
    if (error) {
      setError(isSignUp ? 'Could not create account. Check your details and try again.' : 'Invalid email or password.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSignUp ? 'Start deploying WhatsApp bots in minutes.' : 'Sign in to manage your bots.'}
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="label">
              Name
            </label>
            <input id="name" name="name" required autoComplete="name" className="input" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="input"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account? ' : 'New to NEXUS HOST? '}
        <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="text-primary hover:underline">
          {isSignUp ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  )
}
