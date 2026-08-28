import assert from 'node:assert/strict'
import test from 'node:test'
import { createRefundRequestId } from '../src/lib/refundRequestId.ts'

test('refund request IDs work without crypto.randomUUID', () => {
  const requestId = createRefundRequestId({
    getRandomValues(bytes) {
      bytes.set(Array.from({ length: 16 }, (_, index) => index))
      return bytes
    },
  })

  assert.equal(requestId, '00010203-0405-4607-8809-0a0b0c0d0e0f')
})

test('refund request IDs remain unique UUID v4 values', () => {
  const firstRequestId = createRefundRequestId()
  const secondRequestId = createRefundRequestId()
  const uuidV4Pattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  assert.match(firstRequestId, uuidV4Pattern)
  assert.match(secondRequestId, uuidV4Pattern)
  assert.notEqual(firstRequestId, secondRequestId)
})
