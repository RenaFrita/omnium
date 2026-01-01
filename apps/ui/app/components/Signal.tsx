'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardContent } from './ui/Card'

interface SignalData {
  direction: 'long' | 'short'
  price: number
  score: number
  reasons: string[]
}

interface SignalStats {
  longCount: number
  shortCount: number
  totalSignals: number
  lastSignal: SignalData | null
}

export default function Signal() {
  const [stats, setStats] = useState<SignalStats>({
    longCount: 0,
    shortCount: 0,
    totalSignals: 0,
    lastSignal: null,
  })

  const longAudio = useRef<HTMLAudioElement | null>(null)
  const shortAudio = useRef<HTMLAudioElement | null>(null)
  const openAudio = useRef<HTMLAudioElement | null>(null)
  const closeAudio = useRef<HTMLAudioElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initialize audio elements
    longAudio.current = new Audio('/long.mp3')
    shortAudio.current = new Audio('/short.mp3')
    openAudio.current = new Audio('/open_trade.mp3')
    closeAudio.current = new Audio('/close_trade.mp3')

    // Load all audio files
    if (longAudio.current) longAudio.current.load()
    if (shortAudio.current) shortAudio.current.load()
    if (openAudio.current) openAudio.current.load()
    if (closeAudio.current) closeAudio.current.load()

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001')
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const signal: SignalData = JSON.parse(event.data)
        if (signal.direction && signal.score) {

          setStats((prev) => ({
            longCount: prev.longCount + (signal.direction === 'long' ? 1 : 0),
            shortCount:
              prev.shortCount + (signal.direction === 'short' ? 1 : 0),
            totalSignals: prev.totalSignals + 1,
            lastSignal: signal,
          }))

          // Play audio notification
          const audio =
            signal.direction === 'long' ? longAudio.current : shortAudio.current
          if (audio) {
            audio.play().catch((e) => console.log('Audio play failed:', e))
          }
        }
      } catch (error) {
        console.error('Failed to parse signal:', error)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const playAudio = (type: 'open' | 'close') => {
    const audio = type === 'open' ? openAudio.current : closeAudio.current
    if (audio) {
      audio.play().catch((e) => console.log('Audio play failed:', e))
    }
  }

  const getSignalIcon = (direction: string) => {
    return direction === 'long' ? '📈' : '📉'
  }

  const getSignalColor = (direction: string) => {
    return direction === 'long' ? 'text-green-400' : 'text-red-400'
  }

  const getSignalBg = (direction: string) => {
    return direction === 'long' ? 'bg-green-500/10' : 'bg-red-500/10'
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader
            title="Signal Statistics"
            subtitle="Real-time performance"
          />
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Signals</span>
                <span className="text-white font-mono text-xl">
                  {stats.totalSignals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400">Long Signals</span>
                <span className="text-green-400 font-mono text-xl">
                  {stats.longCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400">Short Signals</span>
                <span className="text-red-400 font-mono text-xl">
                  {stats.shortCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Last Signal"
            subtitle="Most recent trading signal"
          />
          <CardContent>
            {stats.lastSignal ? (
              <div
                className={`p-4 rounded-lg ${getSignalBg(stats.lastSignal?.direction)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-2xl ${getSignalColor(stats.lastSignal?.direction)}`}
                  >
                    {getSignalIcon(stats.lastSignal?.direction)}
                  </span>
                  <span
                    className={`font-bold ${getSignalColor(stats.lastSignal?.direction)}`}
                  >
                    {stats.lastSignal.direction?.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-mono">
                      ${stats.lastSignal.price?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score:</span>
                    <span className="text-white font-mono">
                      {stats.lastSignal?.score}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                No signals yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Controls" subtitle="Trade management" />
          <CardContent>
            <div className="space-y-3">
              <button
                onClick={() => playAudio('open')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📈 Open Trade
              </button>
              <button
                onClick={() => playAudio('close')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📉 Close Trade
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
