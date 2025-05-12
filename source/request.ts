import { events } from './events'
import { fail } from './fail'
import { ok } from './ok'
import { settings } from './settings'
import type { Failure } from './Failure'

const delay = settings.delay

if (delay) console.warn(`API delay is enabled (${delay}ms)`)

let challenge: string | null = null

export function authenticate(value: string | null) {
  challenge = value
}

let _fetch = fetch

export function use(fetcher: typeof fetch) {
  _fetch = fetcher
}

export async function request<T = unknown>(
  path: string,
  options: Options = {}
): Promise<T | Failure> {
  options.headers ??= {}
  options.headers['accept'] ??= 'application/json'

  if (delay)
    options.headers['sleep'] = Math.round((Math.random() * delay) / 2 + delay / 2).toString()

  const authentication = options.credentials === 'include'

  if (options.body !== undefined)
    if (options.body instanceof File || options.body instanceof ReadableStream) {
      options.method ??= 'POST'
      options.duplex = 'half'
      options.headers['content-type'] ??= 'application/octet-stream'
    } else {
      options.body = JSON.stringify(options.body)
      options.headers['content-type'] ??= 'application/json'
    }

  if (authentication && options.headers['authorization'] === undefined) {
    if (challenge === null)
      throw new Error(`Credentials must be set before sending authenticated request ${options.method ?? 'GET'} ${path}`)

    options.headers['authorization'] = challenge
    delete options.credentials // no cookies
  }

  const start = performance.now()

  const id =
    typeof window !== 'undefined' && (window.crypto.randomUUID?.() ?? Math.random().toString())

  if (id) events.emit('request', { id, path, options })

  const response = await _fetch(settings.origin + path, options)

  if (id)
    events.emit('response', { id, status: response.status, duration: performance.now() - start })

  if (!response.ok) return await fail(response)
  else return await ok<T>(response)
}

export interface Options extends Omit<RequestInit, 'headers'> {
  duplex?: 'half'

  body?: any
  headers?: Record<string, string>
}
