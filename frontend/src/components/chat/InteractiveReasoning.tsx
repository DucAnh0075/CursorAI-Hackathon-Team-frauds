import React, { useState, useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { chatService, ReasoningStep, ReasoningAnalysis } from '@/services/chatService'
import './InteractiveReasoning.css'

interface Props {
  problem: string
  image?: string
  onComplete: () => void
  onCancel: () => void
}

// Render raw LaTeX (math field without delimiters) as display math
function renderRawMath(content: string): string {
  if (!content) return ''
  try {
    return katex.renderToString(content.trim(), { displayMode: true, throwOnError: false })
  } catch {
    return `<code>${content}</code>`
  }
}

// Render text with inline math ($ ... $ or \( ... \))
function renderTextWithMath(content: string): string {
  if (!content) return ''
  
  let result = content
  
  // Replace $...$ with rendered KaTeX (inline)
  result = result.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<code>${math}</code>`
    }
  })
  
  // Replace \(...\) with rendered KaTeX (inline)
  result = result.replace(/\\\(([^)]+)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<code>${math}</code>`
    }
  })
  
  return result
}

export const InteractiveReasoning: React.FC<Props> = ({
  problem,
  image,
  onComplete,
  onCancel
}) => {
  const [analysis, setAnalysis] = useState<ReasoningAnalysis | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Analyze the problem on mount
  useEffect(() => {
    const analyze = async () => {
      try {
        setLoading(true)
        const result = await chatService.analyzeForReasoning(problem, image)
        setAnalysis(result)
        setCurrentStep(0)
      } catch (err) {
        setError('Failed to analyze problem. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    analyze()
  }, [problem, image])

  // Speak current step
  const speakStep = async (step: ReasoningStep) => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }

    try {
      // Strip LaTeX for speech
      const cleanText = `${step.title}. ${step.explanation}. ${step.key_insight}`
        .replace(/\\\(|\\\)|\\\[|\\\]|\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
        .replace(/\\[a-zA-Z]+/g, ' ')
      
      const audioData = await chatService.generateSpeech(cleanText)
      
      if (audioData && audioRef.current) {
        audioRef.current.src = audioData
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Speech failed:', err)
    }
  }

  const handleNext = () => {
    if (analysis && currentStep < analysis.total_steps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="reasoning-container">
        <div className="reasoning-loading">
          <div className="reasoning-spinner" />
          <span>Analyzing problem...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reasoning-container">
        <div className="reasoning-error">
          <span>{error}</span>
          <button onClick={onCancel}>Close</button>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const step = analysis.steps[currentStep]
  const isLastStep = currentStep === analysis.total_steps - 1

  return (
    <div className="reasoning-container">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
      
      {/* Header */}
      <div className="reasoning-header">
        <span className="reasoning-progress">
          Step {currentStep + 1} of {analysis.total_steps}
        </span>
        <button className="reasoning-close" onClick={onCancel}>×</button>
      </div>

      {/* Progress bar */}
      <div className="reasoning-progress-bar">
        <div 
          className="reasoning-progress-fill"
          style={{ width: `${((currentStep + 1) / analysis.total_steps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="reasoning-content">
        <h3 className="reasoning-title">{step.title}</h3>
        
        <div 
          className="reasoning-explanation"
          dangerouslySetInnerHTML={{ __html: renderTextWithMath(step.explanation) }}
        />
        
        {step.math && (
          <div 
            className="reasoning-math"
            dangerouslySetInnerHTML={{ __html: renderRawMath(step.math) }}
          />
        )}

        <div className="reasoning-insight">
          💡 {step.key_insight}
        </div>
      </div>

      {/* Final answer (only on last step) */}
      {isLastStep && (
        <div className="reasoning-final">
          <strong>Final Answer:</strong>
          <div dangerouslySetInnerHTML={{ __html: renderRawMath(analysis.final_answer) }} />
        </div>
      )}

      {/* Controls */}
      <div className="reasoning-controls">
        <button 
          className="reasoning-btn reasoning-btn-secondary"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          ← Back
        </button>

        <button 
          className="reasoning-btn reasoning-btn-speak"
          onClick={() => speakStep(step)}
        >
          {isPlaying ? '⏸️ Pause' : '🔊 Listen'}
        </button>

        {isLastStep ? (
          <button 
            className="reasoning-btn reasoning-btn-primary"
            onClick={onComplete}
          >
            Done ✓
          </button>
        ) : (
          <button 
            className="reasoning-btn reasoning-btn-primary"
            onClick={handleNext}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

export default InteractiveReasoning
