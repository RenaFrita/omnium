import { intervals } from "./constants";

export interface Candle {
  t: number; // open millis
  T: number; // close millis
  s: string; // coin
  i: string; // interval
  o: number; // open price
  c: number; // close price
  h: number; // high price
  l: number; // low price
  v: number; // volume (base unit)
  n: number; // number of trades
}

export type Bias = "bullish" | "bearish" | null
export type SwingType = "High" | "Low" | null
export type Swing = "HH" | "HL" | "LH" | "LL" | null

export interface CandleUI extends Candle {
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

export type Interval = typeof intervals[number];