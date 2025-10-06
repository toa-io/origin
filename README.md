# Toa Origin

[Exposition](https://github.com/toa-io/toa/tree/dev/extensions/exposition) Client

## Usage

```typescript
import { connect } from '@toa.io/origin'
import type { MyEntity } from './MyEntity'

const origin = connect({ origin: 'https://my-origin.com' })
const favorites = origin.resource<Favorite>('/favorites/')

export async function get(): Promise<Favorite[] | Error> {
  return favorites.json<Favorite[]>('', { method: 'GET' })
}

// POST /favorites/:identity/ with typed body
type Post = Omit<Favorite, 'id'>

export async function post(identity: string, body: Post): Promise<Favorite | Error> {
  return favorites.json(identity, { method: 'POST', body, credentials: 'include' })
}

// DELETE /favorites/:identity/:id/
export async function del(identity: string, id: string): Promise<Favorite | Error> {
  return favorites.json(`${identity}/${id}`, { method: 'DELETE', credentials: 'include' })
}
```
