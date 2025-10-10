import { formats } from './criteria'

function query(params?: URLSearchParams, options?: Options): string {
  if (params === undefined) return ''

  const parts: string[] = []
  const criteria: string[] = []

  for (const [key, value] of params.entries()) {
    const name = options?.map?.[key] ?? key

    if (SEPARATE.includes(name) || options?.separate?.includes(name) === true)
      parts.push(`${name}=${value}`)
    else {
      const format = formats.find((format) => format.test(value))

      if (format === undefined)
        criteria.push(`${name}==${value}`)
      else
        criteria.push(...format.format(name, value))
    }
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
