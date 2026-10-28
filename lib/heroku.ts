import 'server-only'

const API = 'https://api.heroku.com'

async function heroku<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.HEROKU_API_KEY
  if (!key) throw new Error('Heroku API key is not configured')

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.heroku+json; version=3',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...init.headers,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Heroku request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function githubTarballUrl(repoUrl: string, branch: string) {
  const match = repoUrl.trim().match(/github\.com\/([^/]+)\/([^/#?]+)/i)
  if (!match) throw new Error('Repository must be a public GitHub URL')
  const repo = match[2].replace(/\.git$/, '')
  return `https://github.com/${match[1]}/${repo}/tarball/${encodeURIComponent(branch)}`
}

type AppSetup = {
  id: string
  status: 'pending' | 'succeeded' | 'failed'
  failure_message: string | null
  app: { id: string; name: string }
  build?: { status?: string } | null
}

export function createAppSetup(input: {
  appName: string
  tarballUrl: string
  env: Record<string, string>
}) {
  return heroku<AppSetup>('/app-setups', {
    method: 'POST',
    body: JSON.stringify({
      app: { name: input.appName },
      source_blob: { url: input.tarballUrl },
      overrides: { env: input.env },
    }),
  })
}

export function getAppSetup(id: string) {
  return heroku<AppSetup>(`/app-setups/${id}`)
}

export function getApp(id: string) {
  return heroku<{ id: string; name: string; web_url: string }>(`/apps/${id}`)
}

export function deleteApp(id: string) {
  return heroku<unknown>(`/apps/${id}`, { method: 'DELETE' })
}

export function restartApp(id: string) {
  return heroku<unknown>(`/apps/${id}/dynos`, { method: 'DELETE' })
}
