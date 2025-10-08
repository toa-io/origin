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

  public async json<R = T, F extends E = E>(rel: string = '', init?: RequestOptions): Promise<R | F> {
    const abs = this.abs(rel)
    const options = Object.assign({}, this.init, init)

    return await this.agent.json<R, F>(abs, options)
  }

  public async octets<T extends Record<string, unknown> = Record<string, unknown>, F extends E = E>(rel: string = '', init?: RequestOptions): Promise<[OctetsEntry, Emitter<Faulty<T>>] | F> {
    const abs = this.abs(rel)
    const options = Object.assign({}, this.init, init)

    return await this.agent.octets<T, F>(abs, options)
  }

  private abs(rel: string): string {
    const base = new URL(this.path, 'uri://void')
    const url = new URL(rel, base)

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
