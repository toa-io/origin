import type { Agent, RequestOptions } from './Agent'
import type { GenericError } from './Error'
import type { Faulty, OctetsEntry } from './Octets'
import type { Emitter } from 'mitt'

class Resource<T = unknown, E extends GenericError = GenericError> {
  private readonly agent: Agent
  private readonly path: string
  private readonly init?: Partial<RequestOptions>

  public constructor(options: Options) {
    this.agent = options.agent
    this.path = options.path
    this.init = options.init
  }

  public async json<R = T, F extends E = E>(init?: RequestOptions): Promise<R | F>
  public async json<R = T, F extends E = E>(rel: string, init?: RequestOptions): Promise<R | F>
  public async json<R = T, F extends E = E>(relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<R | F> {
    return await this.request<R, F>('json', relOrInit, init)
  }

  public async octets<R extends Record<string, unknown> = Record<string, unknown>, F extends E = E>(init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<R>>] | F>
  public async octets<R extends Record<string, unknown> = Record<string, unknown>, F extends E = E>(rel: string, init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<R>>] | F>
  public async octets<R extends Record<string, unknown> = Record<string, unknown>, F extends E = E>(relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<R>>] | F> {
    return await this.request<R, F>('octets', relOrInit, init)
  }

  public async multipart<R = unknown, F extends E = E>(init?: RequestOptions): Promise<AsyncGenerator<R, void, undefined> | F>
  public async multipart<R = unknown, F extends E = E>(rel: string, init?: RequestOptions): Promise<AsyncGenerator<R, void, undefined> | F>
  public async multipart<R = unknown, F extends E = E>(relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<AsyncGenerator<R, void, undefined> | F> {
    return await this.request<R, F>('multipart', relOrInit, init)
  }

  private async request<R, F extends E>(method: 'json', relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<R | F>
  private async request<R extends Record<string, unknown>, F extends E = E>(method: 'octets', relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<R>>] | F>
  private async request<R, F extends E = E>(method: 'multipart', relOrInit?: string | RequestOptions, init?: RequestOptions): Promise<AsyncGenerator<R, void, undefined> | F>
  private async request<R extends T, F extends E = E>(method: 'json' | 'octets' | 'multipart', relOrInit?: string | RequestOptions, init?: RequestOptions) {
    const rel = typeof relOrInit === 'string' ? relOrInit : ''

    init = typeof relOrInit === 'string' ? init : relOrInit

    const abs = this.abs(rel)
    const options = Object.assign({}, this.init, init)

    if (method === 'json')
      return await this.agent.json<R, F>(abs, options)
    else if (method === 'octets')
      return await this.agent.octets<Record<string, unknown>, F>(abs, options)
    else if (method === 'multipart')
      return await this.agent.multipart<R>(abs, options)
    else throw new Error(`Invalid method: ${method}`)
  }

  private abs(rel: string): string {
    const base = new URL(this.path, 'uri://void')
    const url = new URL(rel, base)

    // Allows to use resource.json(id) instead of resource.json(id + '/')
    if (!url.pathname.endsWith('/'))
      url.pathname += '/'

    return url.pathname + url.search
  }
}

interface Options {
  agent: Agent
  path: string
  init?: Partial<RequestOptions>
}

export { Resource }
