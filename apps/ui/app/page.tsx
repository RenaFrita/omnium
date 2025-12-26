import Bull from './components/Bull'

export default function Home() {
  const ws = new WebSocket('ws://localhost:3001')

  ws.onmessage = (e) => {
    const signal = JSON.parse(e.data)
    console.log('SIGNAL', signal)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Bull />
      </main>
    </div>
  )
}
