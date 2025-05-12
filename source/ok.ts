import { meros } from 'meros/browser'
import { events } from './events'

export async function ok<T>(response: Response): Promise<T> {
  const challenge = response.headers.get('authorization')

  if (challenge !== null) events.emit('challenge', challenge)

  const type = response.headers.get('content-type')

  if (type?.startsWith('multipart/')) return (await meros(response)) as T
  else if (type === 'application/json') return (await response.json()) as T
  else if (type?.startsWith('text/')) return (await response.text()) as T
  else return (await response.blob()) as T
}
