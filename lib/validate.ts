export type ActionState = { error?: string; success?: string } | undefined

export function str(formData: FormData, key: string, max = 500) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function int(formData: FormData, key: string) {
  const raw = str(formData, key, 20)
  if (!/^-?\d+$/.test(raw)) return NaN
  return Number.parseInt(raw, 10)
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isGithubRepo(value: string) {
  return isHttpsUrl(value) && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(value.replace(/\.git$/, ''))
}

export const APP_NAME_RE = /^[a-z][a-z0-9-]{2,29}$/
