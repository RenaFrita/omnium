import { Trade, CandleUI, Swing, SwingType } from '../types'
import { RSI } from './RSI'

export class RingBuffer {
  private buffer: (CandleUI | undefined)[]
  private pointer: number = 0
  private isFull: boolean = false
  private rsiCalc = new RSI()

  constructor(public readonly size: number) {
    this.buffer = new Array(size)
  }

  add(trade: Trade): CandleUI {
    const c = +trade.c
    const v = +trade.v
    const o = +trade.o
    const h = +trade.h
    const l = +trade.l

    const prevIdx = (this.pointer - 1 + this.size) % this.size
    const lastTrade = this.buffer[prevIdx]

    const isUpdate = lastTrade && lastTrade.t === trade.t

    const baseIdx = isUpdate
      ? (this.pointer - 2 + this.size) % this.size
      : prevIdx
    const base = this.buffer[baseIdx]

    const ema20 = this.calculateEMA(c, base?.ema20, 20)
    const ema50 = this.calculateEMA(c, base?.ema50, 50)
    const ema100 = this.calculateEMA(c, base?.ema100, 100)
    const ema200 = this.calculateEMA(c, base?.ema200, 200)

    const rsi = this.rsiCalc.calculate(c, 14, !isUpdate)

    const volSMA = this.getFastVolumeSMA(20, isUpdate ? 1 : 0)
    const isVolumeSpike = volSMA ? v > volSMA * 2.0 : false

    const newTrade: CandleUI = {
      ...trade,
      o,
      h,
      l,
      c,
      v,
      ema20,
      ema50,
      ema100,
      ema200,
      rsi,
      volumeSMA20: volSMA,
      isVolumeSpike,
      bias: lastTrade?.bias ?? (c > ema200 ? 'bullish' : 'bearish'),
      swing: null,
      swingType: null,
      bos: null,
      choch: null,
    }

    let currentIndex: number

    if (isUpdate) {
      currentIndex = prevIdx
      const existing = this.buffer[prevIdx]
      if (existing) {
        newTrade.o = existing.o
        newTrade.h = Math.max(existing.h, newTrade.h)
        newTrade.l = Math.min(existing.l, newTrade.l)
        newTrade.v = existing.v + newTrade.v
      }
      this.buffer[prevIdx] = newTrade
    } else {
      currentIndex = this.pointer
      this.buffer[this.pointer] = newTrade
      this.pointer = (this.pointer + 1) % this.size
      if (this.pointer === 0) this.isFull = true
    }

    const fractalIdx = (currentIndex - 2 + this.size) % this.size
    this.detectFractal(fractalIdx)

    this.detectStructure(currentIndex)

    return this.buffer[currentIndex]!
  }

  addDraft(trade: Trade): CandleUI {
    const c = +trade.c
    const v = +trade.v
    const o = +trade.o
    const h = +trade.h
    const l = +trade.l

    const prevIdx = (this.pointer - 1 + this.size) % this.size
    const lastCandle = this.buffer[prevIdx]

    const isNewCandle = !lastCandle || lastCandle.t !== trade.t

    const mergedO = isNewCandle || !lastCandle ? o : lastCandle.o
    const mergedH = isNewCandle || !lastCandle ? h : Math.max(lastCandle.h, h)
    const mergedL = isNewCandle || !lastCandle ? l : Math.min(lastCandle.l, l)
    const mergedV = isNewCandle || !lastCandle ? v : lastCandle.v + v

    const base = isNewCandle
      ? lastCandle
      : this.buffer[(prevIdx - 1 + this.size) % this.size]

    const ema20 = this.calculateEMA(c, base?.ema20, 20)
    const ema50 = this.calculateEMA(c, base?.ema50, 50)
    const ema100 = this.calculateEMA(c, base?.ema100, 100)
    const ema200 = this.calculateEMA(c, base?.ema200, 200)

    const rsi = this.rsiCalc.calculate(c, 14, false)

    const volSMA = this.getFastVolumeSMA(20, isNewCandle ? 0 : 1)
    const isVolumeSpike = volSMA ? v > volSMA * 2.0 : false

    return {
      ...trade,
      o: mergedO,
      h: mergedH,
      l: mergedL,
      v: mergedV,
      ema20,
      ema50,
      ema100,
      ema200,
      rsi,
      volumeSMA20: volSMA,
      isVolumeSpike,
      bias: lastCandle?.bias ?? (c > ema200 ? 'bullish' : 'bearish'),
      swing: lastCandle?.swing ?? null,
      swingType: lastCandle?.swingType ?? null,
      bos: lastCandle?.bos ?? null,
      choch: lastCandle?.choch ?? null,
    }
  }

  private detectFractal(index: number) {
    const curr = this.buffer[index]
    if (!curr) return

    const prev1 = this.get(index - 1)
    const prev2 = this.get(index - 2)
    const next1 = this.get(index + 1)
    const next2 = this.get(index + 2)

    if (!prev1 || !prev2 || !next1 || !next2) return

    let swingType: SwingType = null

    if (
      curr.h > prev1.h &&
      curr.h > prev2.h &&
      curr.h > next1.h &&
      curr.h > next2.h
    )
      swingType = 'High'

    if (
      curr.l < prev1.l &&
      curr.l < prev2.l &&
      curr.l < next1.l &&
      curr.l < next2.l
    )
      swingType = 'Low'

    if (!swingType) return

    curr.swingType = swingType

    const { highs, lows } = this.getLastTwoPivots(index)

    let swing: Swing = null
    if (swingType === 'High') {
      const ref = highs.length ? Math.max(...highs) : curr.h
      swing = curr.h > ref ? 'HH' : 'LH'
    } else {
      const ref = lows.length ? Math.min(...lows) : curr.l
      swing = curr.l < ref ? 'LL' : 'HL'
    }

    curr.swing = swing
  }

  private detectStructure(index: number) {
    const candle = this.buffer[index]
    const prevCandle = this.get(index - 1)
    if (!candle || !prevCandle) return

    const currentTrend =
      prevCandle.bias ??
      (candle.c > (candle.ema200 ?? candle.c) ? 'bullish' : 'bearish')
    candle.bias = currentTrend

    const { highs, lows } = this.getLastTwoPivots(index)
    if (!highs.length || !lows.length) return

    const lastHigh = highs[0]
    const lastLow = lows[0]

    const isBreakoutBull = candle.c > lastHigh && prevCandle.c <= lastHigh
    const isBreakoutBear = candle.c < lastLow && prevCandle.c >= lastLow

    if (isBreakoutBull) {
      if (currentTrend === 'bearish') {
        candle.choch = 'bullish'
        candle.bias = 'bullish'
      } else {
        candle.bos = 'bullish'
      }
    } else if (isBreakoutBear) {
      if (currentTrend === 'bullish') {
        candle.choch = 'bearish'
        candle.bias = 'bearish'
      } else {
        candle.bos = 'bearish'
      }
    }
  }

  private getLastTwoPivots(index: number) {
    const highs: number[] = []
    const lows: number[] = []

    for (let i = 1; i < this.size; i++) {
      const idx = (index - i + this.size) % this.size
      const c = this.buffer[idx]
      if (!c) continue

      if (c.swingType === 'High') highs.push(c.h)
      if (c.swingType === 'Low') lows.push(c.l)

      if (highs.length >= 2 && lows.length >= 2) break
    }

    return { highs, lows }
  }

  private get(index: number): CandleUI | undefined {
    const idx = (index + this.size) % this.size
    return this.buffer[idx]
  }

  private calculateEMA(
    price: number,
    prevEma: number | undefined,
    period: number
  ): number {
    if (prevEma === undefined) return price
    const k = 2 / (period + 1)
    return (price - prevEma) * k + prevEma
  }

  private getFastVolumeSMA(
    period: number,
    offset: number = 0
  ): number | undefined {
    if (!this.isFull && this.pointer - offset < period) return undefined

    let sum = 0
    let count = 0

    for (let i = 1 + offset; i <= period + offset; i++) {
      const idx = (this.pointer - i + this.size) % this.size
      const val = this.buffer[idx]?.v
      if (val !== undefined) {
        sum += val
        count++
      }
    }

    return count === period ? sum / period : undefined
  }

  getHistory(): CandleUI[] {
    const history = this.isFull
      ? [
          ...this.buffer.slice(this.pointer),
          ...this.buffer.slice(0, this.pointer),
        ]
      : this.buffer.slice(0, this.pointer)

    return history.filter((c): c is CandleUI => !!c)
  }
}
