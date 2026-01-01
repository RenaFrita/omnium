'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from './ui/Card'

interface ConnectionStatusProps {
  wsUrl?: string
}

export function ConnectionStatus({ wsUrl = 'ws://localhost:3001' }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [lastMessage, setLastMessage] = useState<Date | null>(null)
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setStatus('connected')
    }

    ws.onmessage = () => {
      setLastMessage(new Date())
      setMessageCount(prev => prev + 1)
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('disconnected')
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        setStatus('connecting')
      }, 3000)
    }

    return () => {
      ws.close()
    }
  }, [wsUrl])

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-400'
      case 'connecting':
        return 'text-yellow-400'
      case 'error':
      case 'disconnected':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '●'
      case 'connecting':
        return '◐'
      case 'error':
      case 'disconnected':
        return '○'
      default:
        return '?'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }

  return (
    <Card>
      <CardHeader 
        title="Connection Status" 
        subtitle="Real-time data feed"
      />
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
              <span className="text-lg">{getStatusIcon()}</span>
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Messages:</span>
            <span className="text-white font-mono">{messageCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Last Signal:</span>
            <span className="text-white font-mono">
              {lastMessage ? lastMessage.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Endpoint:</span>
            <span className="text-blue-400 font-mono text-sm">{wsUrl}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}