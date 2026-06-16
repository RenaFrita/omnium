import { OrderBookDelta } from '../types'

export class OrderBookBuffer {
  private buffer: OrderBookDelta[]
  private writeIndex = 0
  private count = 0

  constructor(public readonly capacity: number) {
    this.buffer = new Array<OrderBookDelta>(capacity)
  }

  append(delta: OrderBookDelta): void {
    this.buffer[this.writeIndex] = delta
    this.writeIndex = (this.writeIndex + 1) % this.capacity

    if (this.count < this.capacity) {
      this.count++
    }
  }

  getEvents(): OrderBookDelta[] {
    const result: OrderBookDelta[] = new Array(this.count)

    const start = this.count === this.capacity ? this.writeIndex : 0

    for (let i = 0; i < this.count; i++) {
      result[i] = this.buffer[(start + i) % this.capacity]
    }

    return result
  }

  get length(): number {
    return this.count
  }

  clear(): void {
    this.writeIndex = 0
    this.count = 0
  }
}
