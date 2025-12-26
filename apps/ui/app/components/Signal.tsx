'use client'

import { useEffect, useRef } from 'react'

export default function SignalListener() {
  const long = useRef<HTMLAudioElement | null>(null)
  const short = useRef<HTMLAudioElement | null>(null)
  const open = useRef<HTMLAudioElement | null>(null)
  const close = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')
    long.current = new Audio('/long.mp3')
    short.current = new Audio('/short.mp3')
    open.current = new Audio('/open_trade.mp3')
    close.current = new Audio('/close_trade.mp3')
    long.current.load()
    short.current.load()
    open.current.load()
    close.current.load()

    ws.onmessage = (event) => {
      const signal = JSON.parse(event.data)
      console.log('Signal received', signal)

      const audio = signal.direction === 'long' ? long.current : short.current

      if (audio) {
        audio.play()
      }
    }

    return () => ws.close()
  }, [])

  return <button onClick={() => open.current?.play()}>open trade</button>
}
