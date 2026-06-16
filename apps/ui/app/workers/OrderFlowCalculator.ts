import type { WsTrade, WsBook, OrderFlowSnapshot } from '../types'

const MAX_CVD_POINTS = 80
const MAX_PRESSURE_POINTS = 60
const MAX_LARGE_PRINTS = 6
const MAX_WINDOW_TRADES = 2000
const IMBALANCE_LEVELS = 10
const DEPTH_PCT = 0.5
const AVG_TRADE_WINDOW = 200

const ALERT_BOOK = 0.25
const ALERT_TRADE = 0.68
const ALERT_AGGR = 0.70
const ALERT_CONFIRM_MS = 5000
const CVD_THRESHOLD_FRACTION = 0.02

let _lastTs = 0
let _lastLabel = ''
function tsLabel(ts: number): string {
  const s = Math.floor(ts / 1000)
  if (s === _lastTs) return _lastLabel
  _lastTs = s
  const d = new Date(ts)
  _lastLabel = d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return _lastLabel
}

interface WindowTrade {
  ts: number
  isBuy: boolean
  vol: number
}

export interface AlertEvent {
  dir: 'LONG' | 'SHORT'
  cvd: number
  bookImb: number
  tradeRatio: number
  aggrRatio: number
}

export class OrderFlowCalculator {
  private cvd = 0
  private cvdData: { t: string; cvd: number }[] = []
  private windowTrades: WindowTrade[] = []
  private buyVol60 = 0
  private sellVol60 = 0
  private largePrints: {
    price: number
    size: number
    usd: number
    side: string
    t: string
  }[] = []
  private aggrBuys = 0
  private aggrSells = 0
  private aggrTotal = 0
  private vwapPV = 0
  private vwapV = 0
  private bookImb = 0
  private bidDepth = 0
  private askDepth = 0
  private pressureData: { t: string; imbalance: number }[] = []
  private avgTradeValues: number[] = []
  private avgTradeSum = 0
  private largePrintMultiplier = 5

  private lastSentSnap = ''

  // Alert state
  private lastAlertTs = 0
  private pendingDir: 'LONG' | 'SHORT' | null = null
  private confirmTimer: ReturnType<typeof setTimeout> | null = null
  private coin = ''
  private bbo = { bid: 0, ask: 0, mid: 0 }
  private onAlert: ((alert: AlertEvent) => void) | null = null

  setOnAlert(cb: (alert: AlertEvent) => void) {
    this.onAlert = cb
  }

  setCoin(name: string) {
    this.coin = name
  }

  setLargePrintMultiplier(mult: number) {
    this.largePrintMultiplier = mult
  }

  reset() {
    this.cvd = 0
    this.cvdData = []
    this.windowTrades = []
    this.buyVol60 = 0
    this.sellVol60 = 0
    this.largePrints = []
    this.aggrBuys = 0
    this.aggrSells = 0
    this.aggrTotal = 0
    this.vwapPV = 0
    this.vwapV = 0
    this.bookImb = 0
    this.bidDepth = 0
    this.askDepth = 0
    this.pressureData = []
    this.avgTradeValues = []
    this.avgTradeSum = 0
    this.lastAlertTs = 0
    this.clearPending()
  }

  private clearPending() {
    this.pendingDir = null
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer)
      this.confirmTimer = null
    }
  }

  private getDynamicCvdThreshold(): number {
    return (this.buyVol60 + this.sellVol60) * CVD_THRESHOLD_FRACTION
  }

  private getAvgTradeValue(): number {
    if (this.avgTradeValues.length === 0) return 0
    return this.avgTradeSum / this.avgTradeValues.length
  }

  private getLargePrintThreshold(): number {
    return this.getAvgTradeValue() * this.largePrintMultiplier
  }

  private pushAvgTradeValue(usd: number) {
    this.avgTradeValues.push(usd)
    this.avgTradeSum += usd
    if (this.avgTradeValues.length > AVG_TRADE_WINDOW) {
      const old = this.avgTradeValues.shift()!
      this.avgTradeSum -= old
    }
  }

  private checkAlert() {
    const totalVol = this.buyVol60 + this.sellVol60
    const tr = totalVol > 0 ? this.buyVol60 / totalVol : 0.5
    const ar = this.aggrTotal > 0 ? this.aggrBuys / this.aggrTotal : 0.5
    const cvdThreshold = this.getDynamicCvdThreshold()

    const longs = (this.cvd > cvdThreshold ? 1 : 0) +
      (this.bookImb > ALERT_BOOK ? 1 : 0) +
      (tr > ALERT_TRADE ? 1 : 0) +
      (ar > ALERT_AGGR ? 1 : 0)

    const shorts = (this.cvd < -cvdThreshold ? 1 : 0) +
      (this.bookImb < -ALERT_BOOK ? 1 : 0) +
      (tr < 1 - ALERT_TRADE ? 1 : 0) +
      (ar < 1 - ALERT_AGGR ? 1 : 0)

    const cand: 'LONG' | 'SHORT' | null = longs === 4 ? 'LONG' : shorts === 4 ? 'SHORT' : null

    if (cand !== this.pendingDir) {
      this.clearPending()
      this.pendingDir = cand
      if (cand) {
        this.confirmTimer = setTimeout(() => {
          if (Date.now() - this.lastAlertTs < 300000) return
          const tr2 = (this.buyVol60 + this.sellVol60) > 0 ? this.buyVol60 / (this.buyVol60 + this.sellVol60) : 0.5
          const ar2 = this.aggrTotal > 0 ? this.aggrBuys / this.aggrTotal : 0.5
          const cvdThresh = this.getDynamicCvdThreshold()
          const ok = cand === 'LONG'
            ? this.cvd > cvdThresh && this.bookImb > ALERT_BOOK && tr2 > ALERT_TRADE && ar2 > ALERT_AGGR
            : this.cvd < -cvdThresh && this.bookImb < -ALERT_BOOK && tr2 < 1 - ALERT_TRADE && ar2 < 1 - ALERT_AGGR
          if (!ok) return
          this.lastAlertTs = Date.now()
          this.pendingDir = null
          this.onAlert?.({
            dir: cand,
            cvd: this.cvd,
            bookImb: this.bookImb,
            tradeRatio: tr2,
            aggrRatio: ar2,
          })
        }, ALERT_CONFIRM_MS)
      }
    }
  }

  processTrade(trade: WsTrade) {
    const price = +trade.px
    const size = +trade.sz
    const isBuy = trade.side === 'B'
    const usd = price * size
    const ts = trade.time || Date.now()
    const t = tsLabel(ts)

    this.cvd += isBuy ? usd : -usd
    this.cvdData.push({ t, cvd: this.cvd })
    if (this.cvdData.length > MAX_CVD_POINTS) {
      this.cvdData.shift()
    }

    this.pushAvgTradeValue(usd)

    const cutoff = ts - 60000
    while (this.windowTrades.length && this.windowTrades[0].ts <= cutoff) {
      const old = this.windowTrades.shift()!
      if (old.isBuy) this.buyVol60 -= old.vol
      else this.sellVol60 -= old.vol
    }
    this.windowTrades.push({ ts, isBuy, vol: usd })
    if (isBuy) this.buyVol60 += usd
    else this.sellVol60 += usd
    if (this.windowTrades.length > MAX_WINDOW_TRADES) {
      const old = this.windowTrades.shift()!
      if (old.isBuy) this.buyVol60 -= old.vol
      else this.sellVol60 -= old.vol
    }

    const lpThreshold = this.getLargePrintThreshold()
    if (lpThreshold > 0 && usd >= lpThreshold) {
      this.largePrints.unshift({ price, size, usd, side: trade.side, t })
      if (this.largePrints.length > MAX_LARGE_PRINTS)
        this.largePrints.length = MAX_LARGE_PRINTS
    }

    if (isBuy) this.aggrBuys++
    else this.aggrSells++
    this.aggrTotal++
    if (this.aggrTotal > 10000) {
      const r = this.aggrBuys / this.aggrTotal
      this.aggrBuys = Math.round(r * 5000)
      this.aggrSells = 5000 - this.aggrBuys
      this.aggrTotal = 5000
    }

    this.vwapPV += price * size
    this.vwapV += size
    if (this.vwapV > 1e7) {
      const v = this.vwapPV / this.vwapV
      this.vwapV = 1e5
      this.vwapPV = v * 1e5
    }

    this.checkAlert()
  }

  processBook(book: WsBook) {
    const bids = book.levels[0]
    const asks = book.levels[1]
    if (!bids?.length || !asks?.length) return

    const bestBid = +bids[0].px
    const bestAsk = +asks[0].px
    const mid = (bestBid + bestAsk) / 2
    this.bbo = { bid: bestBid, ask: bestAsk, mid }

    let bLiq = 0, aLiq = 0
    const bn = Math.min(bids.length, IMBALANCE_LEVELS)
    const an = Math.min(asks.length, IMBALANCE_LEVELS)
    for (let i = 0; i < bn; i++) bLiq += +bids[i].sz * +bids[i].px
    for (let i = 0; i < an; i++) aLiq += +asks[i].sz * +asks[i].px
    const tot = bLiq + aLiq
    this.bookImb = tot > 0 ? (bLiq - aLiq) / tot : 0

    this.pressureData.push({
      t: tsLabel(Date.now()),
      imbalance: this.bookImb * 100,
    })
    if (this.pressureData.length > MAX_PRESSURE_POINTS)
      this.pressureData.shift()

    const range = mid * (DEPTH_PCT / 100)
    this.bidDepth = 0
    this.askDepth = 0
    for (let i = 0; i < bids.length; i++) {
      const px = +bids[i].px
      if (px < mid - range) break
      this.bidDepth += +bids[i].sz * px
    }
    for (let i = 0; i < asks.length; i++) {
      const px = +asks[i].px
      if (px > mid + range) break
      this.askDepth += +asks[i].sz * px
    }

    this.checkAlert()
  }

  getSnapshot(): OrderFlowSnapshot | null {
    const totalVol = this.buyVol60 + this.sellVol60
    const tradeRatio = totalVol > 0 ? this.buyVol60 / totalVol : 0.5
    const aggrRatio = this.aggrTotal > 0 ? this.aggrBuys / this.aggrTotal : 0.5
    const cvdThreshold = this.getDynamicCvdThreshold()
    const lpThreshold = this.getLargePrintThreshold()

    const snapKey = `${this.cvd}|${tradeRatio}|${aggrRatio}|${this.bookImb}|${this.bidDepth}|${this.askDepth}|${this.cvdData.length}|${this.pressureData.length}|${this.vwapV}|${this.pendingDir}|${cvdThreshold}|${lpThreshold}`
    if (snapKey === this.lastSentSnap) return null
    this.lastSentSnap = snapKey

    return {
      cvd: this.cvd,
      cvdData: this.cvdData,
      buyVol60: this.buyVol60,
      sellVol60: this.sellVol60,
      tradeRatio,
      largePrints: this.largePrints,
      aggrBuys: this.aggrBuys,
      aggrSells: this.aggrSells,
      aggrTotal: this.aggrTotal,
      aggrRatio,
      vwap: this.vwapV > 0 ? this.vwapPV / this.vwapV : null,
      bookImb: this.bookImb,
      bidDepth: this.bidDepth,
      askDepth: this.askDepth,
      pressureData: this.pressureData,
      pendingDir: this.pendingDir,
      lastAlert: this.lastAlertTs,
      cvdThreshold,
      largePrintThreshold: lpThreshold,
    }
  }
}
