import { Err } from 'error-value'
import mitt, { type Emitter } from 'mitt'
import { request, type Options } from './request'
import type { Failure } from './Failure'
import type { OctetsEntry, WorkflowStep } from './Octets'

export class Method<Entity = never> {
  private readonly base: string
  private readonly options?: Options

  constructor(base: string, options?: Options) {
    this.base = base
    this.options = options
  }

  public async none(segments?: string[] | string, options?: Options): Promise<void | Failure> {
    return await this.request(segments, options)
  }

  public async value<T = Entity>(segments?: string[] | string, options?: Options): Promise<T | Failure> {
    return await this.request<T>(segments, options)
  }

  public async array<T = Entity[]>(segments?: string[] | string, options?: Options): Promise<T[] | Failure> {
    return await this.request<T[]>(segments, options)
  }

  public async multipart<T = Entity>(
    segments?: string[] | string,
    options?: Options
  ): Promise<AsyncGenerator<T, void, undefined> | Failure> {
    const generator = await this.request<AsyncGenerator<{ body: string }>>(segments, options)

    if (generator instanceof Error) return generator

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

  public async octets<Events extends Record<string, unknown>>(
    segments?: string[],
    options?: Options
  ): Promise<[OctetsEntry, Emitter<Events>] | Failure> {
    const generator = await this.multipart(segments, options)

    if (generator instanceof Error) return generator

    const chunk = await generator.next()
    const entry = chunk.value as OctetsEntry
    const emitter = mitt<Events>()

    void (async() => {
      for await (const part of generator) {
        const workflow = part as WorkflowStep

        console.debug('octets chunk:', workflow)

        const payload =
          workflow.error === undefined
            ? workflow.output
            : new Err(workflow.error.code, workflow.error.message)

        emitter.emit(workflow.step, payload as Events[typeof workflow.step])
      }

      emitter.off('*')
    })()

    return [entry, emitter]
  }

  private async request<T>(segments?: string | string[], options?: Options): Promise<T | Failure> {
    const path = toPath(segments)

    return await request<T>(`${this.base}${path}`, {
      ...this.options,
      ...options
    })
  }
}

function toPath(segments: string | string[] | undefined): string {
  if (segments === undefined) return ''

  if (typeof segments === 'string') return segments

  return segments.filter((s) => s !== undefined).join('/') + '/'
}
