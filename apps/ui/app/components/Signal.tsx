'use client'

import { useEffect, useRef, useState } from 'react'

export default function SignalListener() {
  const long = useRef<HTMLAudioElement | null>(null)
  const short = useRef<HTMLAudioElement | null>(null)
  const open = useRef<HTMLAudioElement | null>(null)
  const close = useRef<HTMLAudioElement | null>(null)
  const [{ shortCount, longCount }, setCount] = useState({
    shortCount: 0,
    longCount: 0,
  })

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

      setCount((state) =>
        signal.direction === 'long'
          ? { ...state, longCount: state.longCount + 1 }
          : { ...state, shortCount: state.shortCount + 1 }
      )
      const audio = signal.direction === 'long' ? long.current : short.current

      if (audio) {
        audio.play()
      }
    }

    return () => ws.close()
  }, [])

  return (
    <>
      <h1>Long count: {longCount}</h1>
      <h1>Short count: {shortCount}</h1>
      <button onClick={() => open.current?.play()}>open trade</button>
    </>
  )
}
