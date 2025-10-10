function query(params?: URLSearchParams, options?: Options): string {
  if (params === undefined) return ''

  const parts: string[] = []
  const criteria: string[] = []

  for (const [key, value] of params.entries()) {
    const name = options?.map?.[key] ?? key

    if (SEPARATE.includes(name) || options?.separate?.includes(name) === true)
      parts.push(`${name}=${value}`)
    else
      criteria.push(`${name}==${value}`)
  }

  if (criteria.length > 0)
    parts.unshift(`criteria=${criteria.join(';')}`)

  return parts.length === 0
    ? ''
    : '?' + parts.join('&')
}

const SEPARATE: string[] = ['omit', 'limit', 'search'] as const

interface Options {
  separate?: string[]
  map?: Record<string, string>
}

export { query }
