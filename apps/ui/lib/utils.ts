export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPrice(price: number): string {
  return formatNumber(price, 2)
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getSignalColor(direction: 'long' | 'short'): string {
  return direction === 'long' ? 'text-green-400' : 'text-red-400'
}

export function getSignalBgColor(direction: 'long' | 'short'): string {
  return direction === 'long' ? 'bg-green-500/20' : 'bg-red-500/20'
}

export function getSignalBorderColor(direction: 'long' | 'short'): string {
  return direction === 'long' ? 'border-green-500/30' : 'border-red-500/30'
}