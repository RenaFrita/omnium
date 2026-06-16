export class RingBuffer<T> {
  private buffer: (T | undefined)[]
  private ptr = 0
  private full = false

  constructor(public readonly size: number) {
    this.buffer = new Array(size)
  }

  add(item: T): T | undefined {
    const old = this.buffer[this.ptr]
    this.buffer[this.ptr] = item
    this.ptr = (this.ptr + 1) % this.size
    if (this.ptr === 0) this.full = true
    return old
  }

  get(idx: number): T | undefined {
    if (idx < 0 || idx >= this.length()) return undefined
    const pos = this.full
      ? (this.ptr + idx) % this.size
      : idx
    return this.buffer[pos]
  }

  length(): number {
    return this.full ? this.size : this.ptr
  }

  toArray(): T[] {
    if (!this.full) {
      return this.buffer.slice(0, this.ptr) as T[]
    }
    const a = new Array<T>(this.size)
    let i = 0
    for (let j = this.ptr; j < this.size; j++) a[i++] = this.buffer[j]!
    for (let j = 0; j < this.ptr; j++) a[i++] = this.buffer[j]!
    return a
  }

  clear() {
    this.buffer = new Array(this.size)
    this.ptr = 0
    this.full = false
  }
}
