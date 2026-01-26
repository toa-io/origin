interface Meta {
  status: number
  headers: Headers
}

const KEY = Symbol('meta')

interface Candidate {
  [KEY]?: Meta
}

export function meta(object: Object): Meta | null {
  const candidate = object as Candidate

  return candidate[KEY] ?? null
}

export function setMeta(object: Candidate, meta: Meta) {
  Object.defineProperty(object, KEY, {
    value: meta,
    writable: false,
    enumerable: false,
    configurable: false,
  })
}
