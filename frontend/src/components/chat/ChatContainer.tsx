import { useState, useRef, useCallback, useEffect } from 'react'
import { Message, ImageAttachment, ChatSession } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { chatService } from '@services/chatService'
import './ChatContainer.css'

interface ChatContainerProps {
  session: ChatSession | null
  onNewSession: () => ChatSession
  onAddMessage: (message: Message) => void
}

export function ChatContainer({ session, onNewSession, onAddMessage }: ChatContainerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (content: string, images: ImageAttachment[]) => {
    // Create session if none exists
    let currentSession = session
    if (!currentSession) {
      currentSession = onNewSession()
    }

    // Get selected model from localStorage
    const selectedModel = localStorage.getItem('selectedModel') || 'openai'

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      images: images.length > 0 ? images : undefined,
      timestamp: new Date()
    }
    
    onAddMessage(userMessage)
    setIsLoading(true)
    
    // Create abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)
    
    scrollToBottom()

    try {
      // Send to API
      const messages = currentSession?.messages || []
      const response = await chatService.sendMessage(
        content,
        images.map(img => img.data),
        messages,
        selectedModel
      )

      // Create assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }
      
      onAddMessage(assistantMessage)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Create error message only if not aborted
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        }
        onAddMessage(errorMessage)
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
      scrollToBottom()
    }
  }

  const messages = session?.messages || []
  const showWelcome = messages.length === 0

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={messagesContainerRef}>
        {showWelcome ? (
          <WelcomeScreen />
        ) : (
          <div className="chat-messages-inner">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="chat-loading">
                <div className="chat-loading-indicator">
                  <div className="chat-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="chat-loading-text">Generating...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="chat-input-wrapper">
        <ChatInput 
          onSend={handleSendMessage} 
          onStop={handleStop}
          isLoading={isLoading}
          isWelcome={showWelcome}
        />
      </div>
    </div>
  )
}
