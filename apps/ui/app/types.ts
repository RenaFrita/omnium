import { intervals } from './constants'

export type PerpMeta = {
  name: string
  szDecimals: number
  maxLeverage: number
}

export interface Trade {
  t: number // open millis
  T: number // close millis
  s: string // coin
  i: string // interval
  o: number // open price
  c: number // close price
  h: number // high price
  l: number // low price
  v: number // volume (base unit)
  n: number // number of trades
}

export type Bias = 'bullish' | 'bearish' | null
export type SwingType = 'High' | 'Low' | null
export type Swing = 'HH' | 'HL' | 'LH' | 'LL' | null

export interface CandleUI extends Trade {
  ema20: number
  ema50: number
  ema100: number
  ema200: number
  rsi?: number
  volumeSMA20?: number
  isVolumeSpike: boolean
  swingType?: SwingType
  swing?: Swing
  bias?: Bias
  bos?: Bias
  choch?: Bias
}

export type Interval = (typeof intervals)[number]

export interface WsTrade {
  coin: string
  side: string
  px: string
  sz: string
  hash: string
  time: number
  // tid is 50-bit hash of (buyer_oid, seller_oid).
  // For a globally unique trade id, use (block_time, coin, tid)
  tid: number
  users: [string, string] // [buyer, seller]
}

// Snapshot feed, pushed on each block that is at least 0.5 since last push
export interface WsBook {
  coin: string
  levels: [Array<WsLevel>, Array<WsLevel>]
  time: number
}

export interface WsBbo {
  coin: string
  time: number
  bbo: [WsLevel | null, WsLevel | null]
}

export interface WsLevel {
  px: string // price
  sz: string // size
  n: number // number of orders
}

export type OrderBookDelta = {
  ts: number
  side: 'bid' | 'ask'
  price: number
  size: number
}

export type AggressiveTrade = {
  price: number
  size: number
  side: 'B' | 'A'
  time: number
}
