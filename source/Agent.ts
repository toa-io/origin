import { Err } from 'error-value'
import { meros } from 'meros/browser'
import mitt from 'mitt'
import type { GenericError } from './Error'
import type { Events } from './Evt'
import type { Faulty, OctetsEntry, WorkflowStep } from './Octets'
import type { Emitter } from 'mitt'

class Agent {
  private readonly origin: string
  private readonly events: Emitter<Events>
  private fetch: Fetch = fetch

  private challenge: string | null = null

  constructor(options: Options) {
    this.origin = options.origin
    this.events = options.events
  }

  public async json<T, E extends GenericError = GenericError>(path: string, init?: Init): Promise<T | E> {
    const options = this.setup(init)
    const response = await this.request(path, options)

    const body = response.headers.get('content-type') === 'application/json'
      ? await response.json()
      : await response.text()

    if (response.ok)
      return body as T
    else {
      this.events.emit('error', { code: response.status, body })

      return new Err(response.status, body) as E
    }
  }

  public async multipart<T = unknown>(path: string, init?: Init): Promise<AsyncGenerator<T, void, undefined> | GenericError> {
    const options = this.setup(init)
    const response = await this.request(path, options)

    if (!response.ok)
      return new Err(response.status, await response.json())

    const generator = await meros(response) as AsyncGenerator<{ body: string }>
    const ack = await generator.next()

    if (JSON.parse(ack.value.body) !== 'ACK') throw new Error('No ACK')

    return (async function * () {
      for await (const chunk of generator) {
        const value = JSON.parse(chunk.body)

        if (value === 'FIN') return

        yield value
      }
    })()
  }

  public async octets<
    T extends Record<string, unknown> = Record<string, unknown>,
    E extends GenericError = GenericError
  >(path: string, init?: Init): Promise<[OctetsEntry, Emitter<Faulty<T>>] | E> {
    const generator = await this.multipart<OctetsEntry | WorkflowStep>(path, init)

    if (generator instanceof Error) return generator as E

    const chunk = await generator.next()
    const entry = chunk.value as OctetsEntry
    const emitter = mitt<Faulty<T>>()

    void (async () => {
      for await (const part of (generator as AsyncGenerator<WorkflowStep>)) {
        const payload =
          part.status === 'completed'
            ? part.output
            : new Err(part.error?.code ?? 'UNKNOWN', part.error?.message)

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

  private setup(init?: Init): InitWithHeaders {
    init ??= {}
    init.headers ??= {}
    init.headers['accept'] ??= 'application/json'

    if (init.credentials === 'include' && init.headers['authorization'] === undefined) {
      if (this.challenge === null)
        throw new Error('Credentials must be set before sending authenticated request')

      init.headers['authorization'] = this.challenge
      delete init.credentials // no cookies
    }

    if (init.body !== undefined)
      if (init.body instanceof File || init.body instanceof ReadableStream) {
        init.method ??= 'POST'
        init.duplex = 'half'
        init.headers['content-type'] ??= (init.body as File).type ?? 'application/octet-stream'
      } else {
        init.body = JSON.stringify(init.body)
        init.headers['content-type'] ??= 'application/json'
      }

    return init as InitWithHeaders
  }

  private async request(path: string, init: Init): Promise<Response> {
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
}

interface Init extends Omit<RequestInit, 'path' | 'headers'> {
  duplex?: 'half'
  body?: any
  headers?: Record<string, string>
}

interface InitWithHeaders extends Init {
  headers: Record<string, string>
}

type Fetch = typeof fetch

export { Agent }
export type { Init }
