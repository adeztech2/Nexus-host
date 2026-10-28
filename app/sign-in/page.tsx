import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { Brand } from '@/components/site-header'
import { getViewer } from '@/lib/session'

export default async function SignInPage() {
  if (await getViewer()) redirect('/dashboard')
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <Brand />
      <AuthForm mode="sign-in" />
    </main>
  )
}
