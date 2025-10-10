import assert from 'node:assert/strict'
import { it } from 'node:test'
import { query } from './query'

it('should build criteria', () => {
  const params = new URLSearchParams()

  params.set('foo', 'bar')
  params.set('baz', 'qux')

  const result = query(params)

  assert.equal(result, '?criteria=foo==bar;baz==qux')
})

it('should build empty criteria', () => {
  const params = new URLSearchParams()

  const result = query(params)

  assert.equal(result, '')
})

it('should separate known parameters', () => {
  const params = new URLSearchParams()

  params.set('foo', 'bar')
  params.set('omit', '10')
  params.set('limit', '20')
  params.set('search', 'qux')

  const result = query(params)

  assert.equal(result, '?criteria=foo==bar&omit=10&limit=20&search=qux')
})

it('should separate specified parameters', () => {
  const params = new URLSearchParams()

  params.set('foo', 'bar')
  params.set('baz', 'qux')

  const result = query(params, { separate: ['baz'] })

  assert.equal(result, '?criteria=foo==bar&baz=qux')
})

it('should map parameters', () => {
  const params = new URLSearchParams()

  params.set('foo', 'bar')
  params.set('baz', 'baz')
  params.set('quz', 'qux')
  params.set('max', '10')

  const result = query(params, { separate: ['qux'], map: { foo: 'bar', quz: 'qux', max: 'limit' } })

  assert.equal(result, '?criteria=bar==bar;baz==baz&qux=qux&limit=10')
})
