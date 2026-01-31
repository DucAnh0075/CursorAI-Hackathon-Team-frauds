import { useState, useRef, useCallback, useEffect } from 'react'
import { Message, ImageAttachment, ChatSession } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { InteractiveReasoning } from './InteractiveReasoning'
import { chatService } from '@services/chatService'
import './ChatContainer.css'

interface ChatContainerProps {
  session: ChatSession | null
  onNewSession: () => ChatSession
  onAddMessage: (message: Message) => void
}

export function ChatContainer({ session, onNewSession, onAddMessage }: ChatContainerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reasoningMode, setReasoningMode] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [reasoningProblem, setReasoningProblem] = useState('')
  const [reasoningImage, setReasoningImage] = useState<string | undefined>()
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

  const toggleReasoningMode = () => {
    setReasoningMode(prev => !prev)
  }

  const handleSendMessage = async (content: string, images: ImageAttachment[], pdfTexts?: string[]) => {
    // Create session if none exists
    let currentSession = session
    if (!currentSession) {
      currentSession = onNewSession()
    }

    // Get selected model from localStorage
    const selectedModel = localStorage.getItem('selectedModel') || 'openai'

    // Build the full message content including PDF text
    let fullContent = content
    if (pdfTexts && pdfTexts.length > 0) {
      const pdfContent = pdfTexts.map((text, i) => `\n\n--- PDF Document ${i + 1} ---\n${text}`).join('')
      fullContent = content + pdfContent
    }

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: fullContent,
      images: images.length > 0 ? images : undefined,
      timestamp: new Date()
    }
    
    onAddMessage(userMessage)
    
    // If reasoning mode is enabled, use interactive reasoning
    if (reasoningMode) {
      setReasoningProblem(fullContent)
      setReasoningImage(images.length > 0 ? images[0].data : undefined)
      setShowReasoning(true)
      return
    }
    
    setIsLoading(true)
    
    // Create abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)
    
    scrollToBottom()

    try {
      // Send to API
      const messages = currentSession?.messages || []
      const imageData = images.map(img => img.data)
      console.log('[ChatContainer] Sending images:', imageData.length, 'images')
      
      const response = await chatService.sendMessage(
        fullContent,
        imageData,
        messages,
        selectedModel,
        false  // Regular mode
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

  const handleReasoningComplete = () => {
    setShowReasoning(false)
    // Add a completion message
    const completionMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '✓ Step-by-step explanation completed.',
      timestamp: new Date()
    }
    onAddMessage(completionMessage)
  }

  const handleReasoningCancel = () => {
    setShowReasoning(false)
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
            
            {/* Interactive Reasoning Panel */}
            {showReasoning && (
              <InteractiveReasoning
                problem={reasoningProblem}
                image={reasoningImage}
                onComplete={handleReasoningComplete}
                onCancel={handleReasoningCancel}
              />
            )}
            
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
          reasoningMode={reasoningMode}
          onToggleReasoningMode={toggleReasoningMode}
        />
      </div>
    </div>
  )
}
