import assert from 'node:assert/strict'
import { it } from 'node:test'
import mitt from 'mitt'
import { Agent } from './Agent'
import type { Events } from './Events'

function connect() {
  const sent: RequestInit[] = []
  const agent = new Agent({ origin: 'https://api.example', events: mitt<Events>() })

  agent.use(async (_, init) => {
    sent.push(init as RequestInit)

    return new Response('null', { headers: { 'content-type': 'application/json' } })
  })

  return { agent, sent }
}

it('should send the challenge as `authorization`, without credentials mode', async () => {
  const { agent, sent } = connect()

  agent.authenticate('Token foo')
  await agent.json('/', { credentials: 'include' })

  assert.equal((sent[0].headers as Record<string, string>).authorization, 'Token foo')
  assert.equal(sent[0].credentials, undefined)
})

it('should keep an `authorization` a request states, without credentials mode', async () => {
  const { agent, sent } = connect()

  agent.authenticate('Token foo')
  await agent.json('/', { credentials: 'include', headers: { authorization: 'Basic bar' } })

  assert.equal((sent[0].headers as Record<string, string>).authorization, 'Basic bar')
  assert.equal(sent[0].credentials, undefined)
})
