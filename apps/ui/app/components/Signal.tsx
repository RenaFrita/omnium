'use client'
import { useEffect, useRef } from 'react'

export default function SignalListener() {
  const audioLong = useRef<HTMLAudioElement | null>(null)
  const audioShort = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioLong.current = new Audio('/long.mp3')
    audioShort.current = new Audio('/short.mp3')
    audioLong.current.load()
    audioShort.current.load()

    const ws = new WebSocket('ws://localhost:3001')

    ws.onmessage = (event) => {
      const signal = JSON.parse(event.data)
      console.log('Signal received', signal)
      const audio = new Audio('/ping.mp3') // coloca o arquivo em /public
      audio.play().catch((err) => console.warn('Audio play failed', err))
    }

    return () => ws.close()
  }, [])

  return (
    <>
      <button onClick={() => audioLong.current?.play()}>Short</button>
      <button onClick={() => audioShort.current?.play()}>Long</button>
    </>
  )
}
