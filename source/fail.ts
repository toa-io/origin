import { Failure } from './Failure'
import { events } from './events'

export async function fail(response: Response): Promise<Failure> {
  const payload =
    response.headers.get('content-type') === 'application/json'
      ? await response.json()
      : await response.text()

  events.emit(response.status, payload)

  return new Failure(response.status)
}
