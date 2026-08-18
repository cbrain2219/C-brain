import { describe, expect, it } from 'vitest'
import { createPendingAssetProducerKey, GenerationPendingAssetRegistry } from './generationPendingAssetRegistry'

describe('GenerationPendingAssetRegistry', () => {
  it('keeps concurrent producers separate and exposes active-generation totals', () => {
    const registry = new GenerationPendingAssetRegistry()
    const a = createPendingAssetProducerKey()
    const b = createPendingAssetProducerKey()
    expect(registry.update({ count: 1, generation: 'record-a', producerKey: a })).toBe(1)
    expect(registry.update({ count: 2, generation: 'record-b', producerKey: b })).toBe(2)
    expect(registry.countForGeneration('record-a')).toBe(1)
    expect(registry.countForGeneration('record-b')).toBe(2)
    expect(registry.total()).toBe(3)
    expect(registry.update({ count: 0, generation: 'record-a', producerKey: a })).toBe(0)
    expect(registry.countForGeneration('record-b')).toBe(2)
  })

  it('never creates negative or NaN busy work', () => {
    const registry = new GenerationPendingAssetRegistry()
    const producer = createPendingAssetProducerKey()
    expect(registry.update({ count: -1, generation: 'record', producerKey: producer })).toBe(0)
    expect(registry.update({ count: Number.NaN, generation: 'record', producerKey: producer })).toBe(0)
  })

  it('does not let a late old-generation zero clear a newer reuse of the same producer', () => {
    const registry = new GenerationPendingAssetRegistry()
    const producer = createPendingAssetProducerKey()
    expect(registry.update({ count: 1, generation: 'record-a', producerKey: producer })).toBe(1)
    expect(registry.update({ count: 1, generation: 'record-b', producerKey: producer })).toBe(1)
    expect(registry.update({ count: 0, generation: 'record-a', producerKey: producer })).toBe(0)
    expect(registry.countForGeneration('record-b')).toBe(1)
    expect(registry.total()).toBe(1)
  })
})
