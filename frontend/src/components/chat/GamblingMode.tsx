import React, { useState, useEffect, useRef } from 'react'
import { chatService, GamblingAnalysis } from '@/services/chatService'
import './GamblingMode.css'

interface GamblingMessage {
  role: 'user' | 'assistant'
  content: string
  analysis?: GamblingAnalysis
}

interface Props {
  scenario: string
  image?: string
  onClose: () => void
  conversationHistory: GamblingMessage[]
  onUpdateHistory: (history: GamblingMessage[]) => void
}

export const GamblingMode: React.FC<Props> = ({
  scenario,
  image,
  onClose,
  conversationHistory,
  onUpdateHistory
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUpInput, setFollowUpInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  // Analyze initial scenario if it's new (not already in history)
  useEffect(() => {
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop()
    if (!lastUserMessage || lastUserMessage.content !== scenario) {
      analyzeScenario(scenario, image)
    }
  }, [scenario])

  const buildApiHistory = (): Array<{ role: string; content: string }> => {
    return conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.role === 'assistant' && msg.analysis 
        ? JSON.stringify(msg.analysis) 
        : msg.content
    }))
  }

  const analyzeScenario = async (query: string, queryImage?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Add user message to history
      const newHistory: GamblingMessage[] = [
        ...conversationHistory,
        { role: 'user', content: query }
      ]
      onUpdateHistory(newHistory)

      // Build history for API (exclude the message we just added)
      const apiHistory = buildApiHistory()
      
      const result = await chatService.analyzeGamblingScenario(query, queryImage, apiHistory)
      
      // Add assistant response to history
      onUpdateHistory([
        ...newHistory,
        { role: 'assistant', content: result.lucky_larry_says, analysis: result }
      ])
    } catch (err) {
      setError('Failed to analyze. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUpInput.trim() || loading) return
    
    const query = followUpInput.trim()
    setFollowUpInput('')
    await analyzeScenario(query)
  }

  const getLatestAnalysis = (): GamblingAnalysis | undefined => {
    const assistantMessages = conversationHistory.filter(m => m.role === 'assistant' && m.analysis)
    return assistantMessages[assistantMessages.length - 1]?.analysis
  }

  if (conversationHistory.length === 0 && loading) {
    return (
      <div className="gambling-container">
        <div className="gambling-loading">
          <div className="gambling-slot">🎰</div>
          <span>Lucky Larry is calculating the odds...</span>
        </div>
      </div>
    )
  }

  if (error && conversationHistory.length === 0) {
    return (
      <div className="gambling-container">
        <div className="gambling-error">
          <span>💔 {error}</span>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const latestAnalysis = getLatestAnalysis()

  return (
    <div className="gambling-container gambling-conversation">
      {/* Header */}
      <div className="gambling-header">
        <span className="gambling-title">🎰 Lucky Larry's Gambling Advisor</span>
        <button className="gambling-close" onClick={onClose}>×</button>
      </div>

      {/* Conversation History */}
      <div className="gambling-messages">
        {conversationHistory.map((msg, index) => (
          <div key={index} className={`gambling-message gambling-message-${msg.role}`}>
            {msg.role === 'user' ? (
              <div className="gambling-user-message">
                <span className="gambling-user-icon">🎲</span>
                <p>{msg.content}</p>
              </div>
            ) : (
              <div className="gambling-larry-message">
                <div className="larry-avatar-small">🤑</div>
                <div className="larry-response">
                  <p>{msg.content}</p>
                  {msg.analysis && (
                    <div className="gambling-mini-stats">
                      <span className="mini-stat win">
                        🎯 Win: {msg.analysis.probability_analysis.win_probability}
                      </span>
                      <span className="mini-stat lose">
                        💸 Lose: {msg.analysis.probability_analysis.lose_probability}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="gambling-message gambling-message-assistant">
            <div className="gambling-larry-message">
              <div className="larry-avatar-small">🤑</div>
              <div className="larry-typing">
                <span>Lucky Larry is thinking</span>
                <span className="typing-dots">...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Latest Win Chance Display */}
      {latestAnalysis && (
        <div className="gambling-win-chance">
          <span className="win-chance-label">Win Chance</span>
          <span className="win-chance-value">{latestAnalysis.probability_analysis.win_probability}</span>
        </div>
      )}

      {/* Follow-up Input */}
      <form className="gambling-follow-up" onSubmit={handleFollowUp}>
        <input
          type="text"
          value={followUpInput}
          onChange={(e) => setFollowUpInput(e.target.value)}
          placeholder="Ask Lucky Larry a follow-up question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !followUpInput.trim()}>
          🎰 Ask
        </button>
      </form>

      {error && <div className="gambling-error-inline">💔 {error}</div>}
    </div>
  )
}

export default GamblingMode
