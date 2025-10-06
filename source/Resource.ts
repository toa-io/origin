import type { Agent, Init } from './Agent'
import type { GenericError } from './Error'
import type { Faulty, OctetsEntry } from './Octets'
import type { Emitter } from 'mitt'

class Resource<T = unknown, E extends GenericError = GenericError> {
  private readonly agent: Agent
  private readonly path: string

  public constructor(options: Options) {
    this.agent = options.agent
    this.path = options.path
  }

  public async json<R = T, F extends E = E>(rel: string = '', init?: Init): Promise<R | F> {
    const abs = this.abs(rel)

    return await this.agent.json<R, F>(abs, init)
  }

  public async octets<T extends Record<string, unknown> = Record<string, unknown>, F extends E = E>(rel: string = '', init?: Init): Promise<[OctetsEntry, Emitter<Faulty<T>>] | F> {
    const abs = this.abs(rel)

    return await this.agent.octets<T, F>(abs, init)
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
}

export { Resource }
