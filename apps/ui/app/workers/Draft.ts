import { WsTrade, Trade, CandleUI, Interval, FootprintLevel } from '../types'
import { RingBuffer } from './RingBuffer'

export const INTERVAL_MS: Record<Interval, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
}

const MAX_FOOTPRINT_LEVELS = 100

function getBucketSize(price: number): number {
  const order = Math.pow(10, Math.floor(Math.log10(price)))
  return Math.max(order / 1000, 0.0001)
}

function footprintArray(fp: Map<number, FootprintLevel>): FootprintLevel[] {
  const arr = new Array<FootprintLevel>(fp.size)
  let i = 0
  for (const v of fp.values()) arr[i++] = v
  return arr.sort((a, b) => b.price - a.price)
}

interface DraftCandle extends Trade {
  footprint?: Map<number, FootprintLevel>
}

export class DraftManager {
  private drafts = new Map<string, DraftCandle>()

  constructor(private buffers: Map<string, RingBuffer>) {}

  processTrade(
    wsTrade: WsTrade,
    onUpdate: (candle: CandleUI, interval: string) => void
  ) {
    const px = +wsTrade.px
    const sz = +wsTrade.sz
    let time = wsTrade.time
    if (time < 1e12) time *= 1000
    const bs = getBucketSize(px)
    const bp = Math.round(px / bs) * bs

    for (const interval of this.buffers.keys()) {
      const intervalMs = INTERVAL_MS[interval as Interval]
      const candleTime = Math.floor(time / intervalMs) * intervalMs

      const draft = this.drafts.get(interval)
      const buffer = this.buffers.get(interval)

      if (draft && draft.t === candleTime) {
        draft.c = px
        draft.v += sz
        if (px > draft.h) draft.h = px
        if (px < draft.l) draft.l = px
        draft.n++

        const fp = draft.footprint || new Map()
        if (!draft.footprint) draft.footprint = fp
        const cur = fp.get(bp) || { price: bp, buyVol: 0, sellVol: 0, delta: 0, total: 0 }
        if (wsTrade.side === 'B') cur.buyVol += sz
        else cur.sellVol += sz
        cur.total += sz
        cur.delta = cur.buyVol - cur.sellVol
        fp.set(bp, cur)
        if (fp.size > MAX_FOOTPRINT_LEVELS) {
          let minKey = bp
          let minVol = cur.total
          for (const [k, v] of fp) {
            if (k !== bp && v.total < minVol) {
              minVol = v.total
              minKey = k
            }
          }
          if (minKey !== bp) fp.delete(minKey)
        }

        if (buffer) {
          const withIndicators = buffer.addDraft(draft)
          withIndicators.footprint = draft.footprint ? footprintArray(draft.footprint) : undefined
          onUpdate(withIndicators, interval)
        }
      } else {
        if (draft && buffer) {
          const closed = buffer.add(draft)
          closed.footprint = draft.footprint ? footprintArray(draft.footprint) : undefined
          onUpdate(closed, interval)
        }
        const newDraft: DraftCandle = {
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
          footprint: new Map(),
        }
        newDraft.footprint!.set(bp, {
          price: bp,
          buyVol: wsTrade.side === 'B' ? sz : 0,
          sellVol: wsTrade.side === 'A' ? sz : 0,
          delta: wsTrade.side === 'B' ? sz : -sz,
          total: sz,
        })

        this.drafts.set(interval, newDraft)
        if (buffer) {
          const withIndicators = buffer.addDraft(newDraft)
          withIndicators.footprint = footprintArray(newDraft.footprint!)
          onUpdate(withIndicators, interval)
        }
      }
    }
  }

  getDrafts(): Map<string, Trade> {
    return this.drafts as Map<string, Trade>
  }
}
