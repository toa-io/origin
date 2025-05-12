# Toa Origin

[Exposition](https://github.com/toa-io/toa/tree/dev/extensions/exposition) Client

## `new Resource<T>(path: string, options?: RequestInit)`

### Parameters

- `path` — Base API path (e.g. '/favorites/').
- `options` — Options passed to `fetch`.
- `T` — Type of the resource representation.

Each HTTP verb (get, post, patch, put, delete) provides the following response handling modes:

- `.value()`: Expects a single JSON object response `T`.
- `.array()`: Expects a JSON array response `T[]`.
- `.none()`: Expects no response body `void`.

```typescript
(resource.<method>).<mode>(
  segments?: string[],              // Optional URL path segments, relative to the base path
  options?: RequestInit             // fetch-compatible request options
): Promise<...>
```

## Usage

```typescript
import { Resource } from '$origin'
import type { Favorite } from './Favorite'

// Initialize a resource client
const favorites = new Resource<Favorite>('/favorites/', { credentials: 'include' })

// GET /favorites/:identity
export async function get(identity: string): Promise<Favorite[] | Error> {
  return favorites.get.array([identity])
}

// POST /favorites/:identity with typed body
type Post = Omit<Favorite, 'id'>

export async function post(identity: string, body: Post): Promise<Favorite | Error> {
  return favorites.post.value([identity], { body })
}

// DELETE /favorites/:identity/:id
export async function del(identity: string, id: string): Promise<Favorite | Error> {
  return favorites.delete.value([identity, id])
}
```
