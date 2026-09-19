import type { Failure } from './Error'
import type { Emitter } from 'mitt'

export interface OctetsEntry {
  id: string
}

export interface WorkflowStep<K extends string = string, T = unknown, E extends Failure = Failure> {
  step: K
  status: 'completed' | 'exception'
  output?: T
  error: E
}

export type Faulty<T extends Record<string, unknown>> = Record<keyof T, T[keyof T] | Failure>

export type Workflow<T extends Record<string, unknown> = Record<string, unknown>> = [OctetsEntry, Emitter<Faulty<T>>]
