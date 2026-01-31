import { useState, useEffect, useCallback } from 'react'
import { ChatSession, Message } from '@/types/chat'

const STORAGE_KEY = 'chat_sessions'

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((s: ChatSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }))
      } catch {
        return []
      }
    }
    return []
  })

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_session_id')
    return saved || null
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('active_session_id', activeSessionId)
    }
  }, [activeSessionId])

  const createSession = useCallback((): ChatSession => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    return newSession
  }, [])

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, ...updates, updatedAt: new Date() }
        : s
    ))
  }, [])

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      
      const updatedMessages = [...s.messages, message]
      
      // Generate title from first user message
      let title = s.title
      if (s.title === 'New Chat' && message.role === 'user') {
        title = generateTitle(message.content)
      }
      
      return {
        ...s,
        messages: updatedMessages,
        title,
        updatedAt: new Date()
      }
    }))
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
    }
  }, [activeSessionId])

  const getActiveSession = useCallback((): ChatSession | null => {
    return sessions.find(s => s.id === activeSessionId) || null
  }, [sessions, activeSessionId])

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    updateSession,
    addMessage,
    deleteSession,
    getActiveSession
  }
}

function generateTitle(content: string): string {
  // Remove images and clean up the text
  const cleaned = content.replace(/\[Image:.*?\]/g, '').trim()
  
  // Take first 50 characters or first sentence
  const firstSentence = cleaned.split(/[.!?]/)[0]
  const title = firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...'
    : firstSentence || 'New Chat'
  
  return title
}
