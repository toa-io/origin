import type { Err } from 'error-value'

export type GenericError<E = unknown> = Err<number, E>
