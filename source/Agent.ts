import { Err } from 'error-value'
import { meros } from 'meros/browser'
import mitt from 'mitt'
import { setMeta } from './meta'
import type { GenericError } from './Error'
import type { Events } from './Events'
import type { Faulty, OctetsEntry, WorkflowStep } from './Octets'
import type { Emitter } from 'mitt'

class Agent {
  private readonly origin: string
  private readonly events: Emitter<Events>
  private sleep?: string
  private fetch: Fetch = fetch.bind(globalThis)

  private challenge: string | null = null

  constructor(options: Options) {
    this.origin = options.origin
    this.events = options.events

    if (options.sleep !== undefined)
      this.sleep = JSON.stringify(options.sleep)
  }

  public async json<T, E extends GenericError = GenericError>(path: string, init?: RequestOptions): Promise<T | E> {
    const options = this.setup(init)
    const response = await this.request(path, options)

    const body = response.headers.get('content-type') === 'application/json'
      ? await response.json()
      : await response.text()

    if (typeof body === 'object' && body !== null)
      setMeta(body, { status: response.status, headers: response.headers })

    if (response.ok) {
      this.events.emit('response', { status: response.status, headers: response.headers })

      return body as T
    } else {
      this.events.emit('error', { code: response.status, body })

      return new Err(response.status, body) as E
    }
  }

  public async multipart<T = unknown>(path: string, init?: RequestOptions): Promise<AsyncGenerator<T, void, undefined> | GenericError> {
    const options = this.setup(init)
    const response = await this.request(path, options)

    if (!response.ok)
      return new Err(response.status, await response.json())

    const generator = await meros(response) as AsyncGenerator<{ body: string }>
    const ack = await generator.next()

    if (options.debug)
      console.debug('Multipart ACK', { path, body: ack.value.body })

    if (JSON.parse(ack.value.body) !== 'ACK') throw new Error('No ACK')

    return (async function * () {
      for await (const chunk of generator) {
        if (options.debug)
          console.debug('Multipart chunk', { path, body: chunk.body })

        const value = JSON.parse(chunk.body)

        if (value === 'FIN') return

        yield value
      }
    })()
  }

  public async octets<
    T extends Record<string, unknown> = Record<string, unknown>,
    E extends GenericError = GenericError
  >(path: string, init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<T>>] | E> {
    const generator = await this.multipart<OctetsEntry | WorkflowStep>(path, init)

    if (generator instanceof Error) return generator as E

    const chunk = await generator.next()
    const entry = chunk.value as OctetsEntry
    const emitter = mitt<Faulty<T>>()

    void (async () => {
      // workflow results may come within the same frame
      await new Promise((resolve) => setTimeout(resolve, 0))

      for await (const part of (generator as AsyncGenerator<WorkflowStep>)) {
        const payload =
          part.status === 'completed'
            ? part.error
              ? new Err(part.error.code ?? 'UNKNOWN', part.error.message)
              : part.output
            : new Err('EXCEPTION')

        if (init?.debug)
          console.debug('Emitting octets step', { path, step: part.step, payload })

        emitter.emit(part.step, payload as T[typeof part.step])
      }

      emitter.off('*')
    })()

    return [entry, emitter]
  }

  public authenticate(challenge: string | null) {
    this.challenge = challenge
  }

  public use(fetch: Fetch) {
    this.fetch = fetch
  }

  private setup(init?: RequestOptions): InitWithHeaders {
    init ??= {}
    init.headers ??= {}
    init.headers['accept'] ??= 'application/json'

    if (this.sleep !== undefined)
      init.headers['sleep'] = this.sleep

    if (init.credentials === 'include' && init.headers['authorization'] === undefined) {
      if (this.challenge === null)
        throw new Error('Credentials must be set before sending authenticated request')

      init.headers['authorization'] = this.challenge
      delete init.credentials // no cookies
    }

    if (init.body !== undefined) {
      init.method ??= 'POST'

      if (init.body instanceof File || init.body instanceof ReadableStream) {
        init.duplex = 'half'
        init.headers['content-type'] ??= (init.body as File).type ?? 'application/octet-stream'
      } else {
        init.body = JSON.stringify(init.body)
        init.headers['content-type'] ??= 'application/json'
      }
    }

    return init as InitWithHeaders
  }

  private async request(path: string, init: RequestOptions): Promise<Response> {
    const url = new URL(path, this.origin)
    const response = await this.fetch(url.href, init)

    const challenge = response.headers.get('authorization')

    if (challenge !== null) {
      this.challenge = challenge
      this.events.emit('challenge', challenge)
    }

    return response
  }
}

interface Options {
  origin: string
  events: Emitter<Events>
  sleep?: [number, number]
}

interface RequestOptions extends Omit<RequestInit, 'path' | 'headers'> {
  duplex?: 'half'
  body?: any
  headers?: Record<string, string>
  debug?: boolean
}

interface InitWithHeaders extends RequestOptions {
  headers: Record<string, string>
}

type Fetch = typeof fetch

export { Agent }
export type { RequestOptions }
