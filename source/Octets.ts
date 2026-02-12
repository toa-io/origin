import type { Err } from 'error-value'
import type { Emitter } from 'mitt'

export interface OctetsEntry {
  id: string
}

export interface WorkflowStep<K extends string = string, T = unknown, E extends Err = Err> {
  step: K
  status: 'completed' | 'exception'
  output?: T
  error: E
}

export type Faulty<T extends Record<string, unknown>> = Record<keyof T, T[keyof T] | Err>

export type Workflow<T extends Record<string, unknown> = Record<string, unknown>> = [OctetsEntry, Emitter<Faulty<T>>]
