/** A reply that is not a success: the status or the code it failed with, and what came with it. */
export class Failure<C extends string | number = string | number, E = unknown> extends Error {
  public readonly code: C
  declare public readonly cause: E

  constructor(code: C, cause?: E) {
    super(undefined, cause === undefined ? undefined : { cause })
    this.code = code
  }
}

export type GenericError<E = unknown> = Failure<number, E>
