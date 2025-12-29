export class RollingZ {
  private mean = 0
  private variance = 0
  private initialized = false

  constructor(private alpha = 0.05) {}

  update(x: number) {
    if (!this.initialized) {
      this.mean = x
      this.variance = 0
      this.initialized = true
      return 0
    }

    const diff = x - this.mean
    this.mean += this.alpha * diff
    this.variance =
      (1 - this.alpha) * (this.variance + this.alpha * diff * diff)

    const std = Math.sqrt(this.variance)
    if (std === 0) return 0

    return diff / std
  }
}
