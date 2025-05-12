export interface OctetsEntry {
  id: string
}

export interface WorkflowStep<K = string, T = unknown> {
  step: K
  status: 'completed' | 'exception'
  output?: T
  error: WorkflowError
}

interface WorkflowError {
  code: string
  message?: string
}
