import mitt from 'mitt'
import { Agent } from './Agent'
import { Resource } from './Resource'
import type { RequestOptions } from './Agent'
import type { Events } from './Events'
import type { Emitter } from 'mitt'

/** Resoruce factory */
class Origin {
  public readonly events: Emitter<Events>
  private readonly agent: Agent

  constructor(options: Options) {
    this.events = mitt<Events>()

    this.agent = new Agent({
      origin: options.origin,
      events: this.events,
    })
  }

  public resource<T = unknown>(path: string, init?: Partial<RequestOptions>) {
    return new Resource<T>({
      agent: this.agent,
      path,
      init,
    })
  }

  public authenticate(challenge: string | null) {
    this.agent.authenticate(challenge)
  }

  public use(fetch: Fetch) {
    this.agent.use(fetch)
  }
}

function connect(options: Options | string) {
  if (typeof options === 'string')
    options = { origin: options }

  return new Origin(options)
}

interface Options {
  origin: string
}

type Fetch = typeof fetch

export { connect }
