import mitt from 'mitt'
import type { Options } from './request'

export const events = mitt<Events>()

export interface Events extends Record<string | symbol, unknown> {
  challenge: string

  request: {
    id: string
    path: string
    options: Options
  }

  response: {
    id: string
    response: Response
    duration: number
  }
}
