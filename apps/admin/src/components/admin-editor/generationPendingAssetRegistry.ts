export type PendingAssetProducerKey = symbol

/** An absolute unfinished-work count reported by one mounted editor producer. */
export type PendingAssetWork = {
  readonly count: number
  readonly generation: string
  readonly producerKey: PendingAssetProducerKey
}

export function createPendingAssetProducerKey(): PendingAssetProducerKey {
  return Symbol('pending-content-asset-producer')
}

/**
 * Tracks producers independently and exposes generation-scoped totals. This
 * prevents a late editor A event from making editor B appear idle.
 */
export class GenerationPendingAssetRegistry {
  private readonly producers = new Map<PendingAssetProducerKey, Map<string, number>>()

  update(event: PendingAssetWork): number {
    const count = Number.isFinite(event.count) ? Math.max(0, Math.trunc(event.count)) : 0
    const generations = this.producers.get(event.producerKey) ?? new Map<string, number>()
    if (count === 0) {
      // A stale A=0 must only settle A. A producer key can be reused by a
      // replacement editor B before the old editor delivers its final event.
      generations.delete(event.generation)
      if (generations.size === 0) this.producers.delete(event.producerKey)
      else this.producers.set(event.producerKey, generations)
    } else {
      generations.set(event.generation, count)
      this.producers.set(event.producerKey, generations)
    }
    return this.countForGeneration(event.generation)
  }

  countForGeneration(generation: string): number {
    let total = 0
    for (const generations of this.producers.values()) {
      total += generations.get(generation) ?? 0
    }
    return total
  }

  total(): number {
    let total = 0
    for (const generations of this.producers.values()) {
      for (const count of generations.values()) total += count
    }
    return total
  }
}
