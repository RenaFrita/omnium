export class RSI {
  private prevAvgGain = 0
  private prevAvgLoss = 0
  private lastClose = 0
  private count = 0

  calculate(
    close: number,
    period: number,
    isNewCandle: boolean
  ): number | undefined {
    if (this.count === 0) {
      if (isNewCandle) {
        this.lastClose = close
        this.count++
      }
      return undefined
    }

    const change = close - this.lastClose
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0

    // Wilder's Smoothing Method
    let currentAvgGain: number
    let currentAvgLoss: number

    if (this.count <= period) {
      currentAvgGain = (this.prevAvgGain * (this.count - 1) + gain) / this.count
      currentAvgLoss = (this.prevAvgLoss * (this.count - 1) + loss) / this.count

      if (isNewCandle) {
        this.prevAvgGain = currentAvgGain
        this.prevAvgLoss = currentAvgLoss
        this.lastClose = close
        this.count++
      }
    } else {
      currentAvgGain = (this.prevAvgGain * (period - 1) + gain) / period
      currentAvgLoss = (this.prevAvgLoss * (period - 1) + loss) / period

      if (isNewCandle) {
        this.prevAvgGain = currentAvgGain
        this.prevAvgLoss = currentAvgLoss
        this.lastClose = close
        this.count++
      }
    }

    if (this.count <= period) return undefined

    const rs = currentAvgGain / (currentAvgLoss || 0.00001)
    return 100 - 100 / (1 + rs)
  }
}