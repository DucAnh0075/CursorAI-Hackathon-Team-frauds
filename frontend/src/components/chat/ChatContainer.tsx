import { useState, useRef, useCallback, useEffect } from 'react'
import { Message, ImageAttachment, ChatSession, FlashcardSet } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { InteractiveReasoning } from './InteractiveReasoning'
import { GamblingMode } from './GamblingMode'
import { Flashcards } from './Flashcards'
import { SlideshowPlayer } from './SlideshowPlayer'
import { chatService, GamblingAnalysis, SlideshowData } from '@services/chatService'
import './ChatContainer.css'

interface GamblingMessage {
  role: 'user' | 'assistant'
  content: string
  analysis?: GamblingAnalysis
}

interface ChatContainerProps {
  session: ChatSession | null
  onNewSession: () => ChatSession
  onAddMessage: (message: Message) => void
  onUpdateSession?: (updates: Partial<ChatSession>) => void
}

export function ChatContainer({ session, onNewSession, onAddMessage, onUpdateSession }: ChatContainerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reasoningMode, setReasoningMode] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [reasoningProblem, setReasoningProblem] = useState('')
  const [reasoningImage, setReasoningImage] = useState<string | undefined>()
  const [gamblingMode, setGamblingMode] = useState(false)
  const [showGambling, setShowGambling] = useState(false)
  const [gamblingScenario, setGamblingScenario] = useState('')
  const [gamblingImage, setGamblingImage] = useState<string | undefined>()
  const [gamblingHistory, setGamblingHistory] = useState<GamblingMessage[]>([])
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [slideshow, setSlideshow] = useState<SlideshowData | null>(null)
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
    if (!reasoningMode) setGamblingMode(false) // Turn off gambling when enabling reasoning
  }

  const toggleGamblingMode = () => {
    setGamblingMode(prev => !prev)
    if (!gamblingMode) setReasoningMode(false) // Turn off reasoning when enabling gambling
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
    
    // If gambling mode is enabled, use gambling analyzer
    if (gamblingMode) {
      setGamblingScenario(fullContent)
      setGamblingImage(images.length > 0 ? images[0].data : undefined)
      setShowGambling(true)
      return
    }
    
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

  const handleGamblingClose = () => {
    setShowGambling(false)
  }

  // Helper function to check if two topics are similar
  const areSimilarTopics = (topic1: string, topic2: string): boolean => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
    const t1 = normalize(topic1)
    const t2 = normalize(topic2)
    
    // Check for exact match or significant overlap
    if (t1 === t2) return true
    
    // Check if one contains the other
    if (t1.includes(t2) || t2.includes(t1)) return true
    
    // Check word overlap (if more than 50% words match)
    const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2))
    const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2))
    
    if (words1.size === 0 || words2.size === 0) return false
    
    const intersection = [...words1].filter(w => words2.has(w))
    const overlapRatio = intersection.length / Math.min(words1.size, words2.size)
    
    return overlapRatio >= 0.5
  }

  const handleCreateFlashcards = (flashcardSet: FlashcardSet) => {
    if (session && onUpdateSession) {
      const existingFlashcards = session.flashcardSets || []
      
      // Find an existing set with a similar topic
      const matchingSetIndex = existingFlashcards.findIndex(
        existing => areSimilarTopics(existing.topic_title, flashcardSet.topic_title)
      )
      
      let updatedFlashcards: FlashcardSet[]
      let messageContent: string
      
      if (matchingSetIndex !== -1) {
        // Merge into existing set
        const existingSet = existingFlashcards[matchingSetIndex]
        
        // Get the highest existing card ID to continue numbering
        const maxId = Math.max(...existingSet.cards.map(c => c.id), 0)
        
        // Re-number the new cards to avoid ID conflicts
        const newCardsWithIds = flashcardSet.cards.map((card, index) => ({
          ...card,
          id: maxId + index + 1
        }))
        
        const mergedSet: FlashcardSet = {
          ...existingSet,
          cards: [...existingSet.cards, ...newCardsWithIds],
          // Update description if new one is different
          description: existingSet.description !== flashcardSet.description 
            ? `${existingSet.description} | ${flashcardSet.description}`
            : existingSet.description,
          // Combine study tips
          study_tips: existingSet.study_tips !== flashcardSet.study_tips
            ? `${existingSet.study_tips} ${flashcardSet.study_tips}`
            : existingSet.study_tips
        }
        
        updatedFlashcards = [...existingFlashcards]
        updatedFlashcards[matchingSetIndex] = mergedSet
        
        messageContent = `📚 Added ${flashcardSet.cards.length} new cards to "${existingSet.topic_title}" (now ${mergedSet.cards.length} total). Click the 📚 button to study!`
      } else {
        // Create new set
        updatedFlashcards = [...existingFlashcards, flashcardSet]
        messageContent = `📚 Created flashcard set: "${flashcardSet.topic_title}" with ${flashcardSet.cards.length} cards. Click the 📚 button in the chat input to study them!`
      }
      
      onUpdateSession({
        flashcardSets: updatedFlashcards
      })
      
      // Add a message indicating flashcards were created/merged
      const flashcardMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date()
      }
      onAddMessage(flashcardMessage)
    }
  }

  const handleDeleteFlashcardSet = (setId: string) => {
    if (session && onUpdateSession) {
      const updatedFlashcards = (session.flashcardSets || []).filter(s => s.id !== setId)
      onUpdateSession({
        flashcardSets: updatedFlashcards
      })
    }
  }

  const handleCreateSlideshow = (slideshowData: SlideshowData) => {
    setSlideshow(slideshowData)
    // Add a message indicating slideshow was created
    const slideshowMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🎬 Created slideshow: "${slideshowData.title}" with ${slideshowData.slides.length} slides. The slideshow is now playing!`,
      timestamp: new Date()
    }
    onAddMessage(slideshowMessage)
  }

  const handleCloseSlideshow = () => {
    setSlideshow(null)
  }

  const messages = session?.messages || []
  const flashcardSets = session?.flashcardSets || []
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
                onCreateFlashcards={handleCreateFlashcards}
                onCreateSlideshow={handleCreateSlideshow}
              />
            )}
            
            {/* Gambling Mode Panel */}
            {showGambling && (
              <GamblingMode
                scenario={gamblingScenario}
                image={gamblingImage}
                onClose={handleGamblingClose}
                conversationHistory={gamblingHistory}
                onUpdateHistory={setGamblingHistory}
              />
            )}

            {/* Flashcards Panel */}
            {showFlashcards && (
              <Flashcards
                flashcardSets={flashcardSets}
                onClose={() => setShowFlashcards(false)}
                onDeleteSet={handleDeleteFlashcardSet}
              />
            )}

            {/* Slideshow Player */}
            {slideshow && (
              <SlideshowPlayer
                slideshow={slideshow}
                onClose={handleCloseSlideshow}
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
          gamblingMode={gamblingMode}
          onToggleGamblingMode={toggleGamblingMode}
          hasFlashcards={flashcardSets.length > 0}
          onShowFlashcards={() => setShowFlashcards(true)}
        />
      </div>
    </div>
  )
}
