import { WsTrade, Trade, CandleUI, Interval } from '../types'
import { RingBuffer } from './RingBuffer'

export const INTERVAL_MS: Record<Interval, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
}

export class DraftManager {
  private drafts = new Map<string, Trade>()

  constructor(private buffers: Map<string, RingBuffer>) {}

  processTrade(
    wsTrade: WsTrade,
    onUpdate: (candle: CandleUI, interval: string) => void
  ) {
    const px = +wsTrade.px
    const sz = +wsTrade.sz
    let time = wsTrade.time
    if (time < 1e12) time *= 1000

    for (const interval of this.buffers.keys()) {
      const intervalMs = INTERVAL_MS[interval as Interval]
      const candleTime = Math.floor(time / intervalMs) * intervalMs

      const draft = this.drafts.get(interval)
      const buffer = this.buffers.get(interval)

      if (draft && draft.t === candleTime) {
        const updated: Trade = {
          ...draft,
          c: px,
          v: draft.v + sz,
          h: Math.max(draft.h, px),
          l: Math.min(draft.l, px),
          n: draft.n + 1,
        }
        this.drafts.set(interval, updated)
        if (buffer) {
          const withIndicators = buffer.addDraft(updated)
          onUpdate(withIndicators, interval)
        }
      } else {
        if (draft && buffer) {
          const closed = buffer.add(draft)
          onUpdate(closed, interval)
        }
        const newDraft: Trade = {
          t: candleTime,
          T: candleTime + intervalMs,
          s: wsTrade.coin,
          i: interval,
          o: px,
          c: px,
          h: px,
          l: px,
          v: sz,
          n: 1,
        }
        this.drafts.set(interval, newDraft)
        if (buffer) {
          const withIndicators = buffer.addDraft(newDraft)
          onUpdate(withIndicators, interval)
        }
      }
    }
  }

  getDrafts(): Map<string, Trade> {
    return this.drafts
  }
}
