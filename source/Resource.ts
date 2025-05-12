import { Method } from './Method'
import type { Options } from './request'

export class Resource<T> {
  public get: Method<T>
  public post: Method<T>
  public patch: Method<T>
  public put: Method<T>
  public delete: Method<never>

  public constructor(base: string, options?: Omit<Options, 'method'>) {
    this.get = new Method<T>(base, { method: 'GET', ...options })
    this.post = new Method<T>(base, { method: 'POST', ...options })
    this.patch = new Method<T>(base, { method: 'PATCH', ...options })
    this.put = new Method<T>(base, { method: 'PUT', ...options })
    this.delete = new Method(base, { method: 'DELETE', ...options })
  }
}
