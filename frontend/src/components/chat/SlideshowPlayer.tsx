import React, { useState, useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { SlideshowData } from '@/services/chatService'
import './SlideshowPlayer.css'

interface Props {
  slideshow: SlideshowData
  onClose: () => void
}

// Render math with KaTeX - with better error handling and fallback
function renderMath(content: string, displayMode: boolean = false): string {
  if (!content) return ''
  
  // Clean up common issues
  let cleanContent = content.trim()
    // Fix common LaTeX issues
    .replace(/\\text\s*{([^}]*)}/g, '\\text{$1}')  // Ensure \text is properly formatted
    .replace(/\s+/g, ' ')  // Normalize whitespace
  
  try {
    return katex.renderToString(cleanContent, { 
      displayMode, 
      throwOnError: false,
      trust: true,
      strict: false
    })
  } catch (e) {
    console.warn('KaTeX render error:', e, 'for content:', cleanContent)
    // Fallback: try to render as plain text with basic formatting
    return `<span class="math-fallback">${cleanContent}</span>`
  }
}

// Format math notation for display
function formatMath(text: string): string {
  if (!text) return ''
  
  let result = text
  
  // Convert log_b(x) to log with subscript: log_3(10) → log₃(10)
  result = result.replace(/log_([0-9a-z])\(/g, (_, sub) => {
    const subscripts: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      'a': 'ₐ', 'b': 'ᵦ', 'n': 'ₙ'
    }
    return `log${subscripts[sub] || sub}(`
  })
  
  // Convert n^2, n^3 to superscript
  result = result.replace(/\^2(?![0-9.])/g, '²')
  result = result.replace(/\^3(?![0-9.])/g, '³')
  
  // Keep n^(something) as is but style it nicely
  // n^(log_3(10)) stays readable
  
  return result
}

export const SlideshowPlayer: React.FC<Props> = ({ slideshow, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(true) // Start with auto-play enabled
  const [isPaused, setIsPaused] = useState(false) // Track if user manually paused
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasStartedRef = useRef(false)

  const slide = slideshow.slides[currentSlide]
  const totalSlides = slideshow.slides.length
  const progress = ((currentSlide + 1) / totalSlides) * 100

  // Auto-start the presentation and play audio when slideshow opens
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      // Small delay before starting to let the UI render
      setTimeout(() => {
        if (slide.has_audio && slide.audio && audioRef.current) {
          audioRef.current.src = slide.audio
          audioRef.current.play().catch(e => console.log('Auto-play blocked:', e))
          setIsPlaying(true)
        }
      }, 500)
    }
  }, [])

  // Auto-play audio when slide changes
  useEffect(() => {
    if (isAutoPlay && !isPaused && slide.has_audio && slide.audio && audioRef.current) {
      // Play audio for the current slide
      audioRef.current.src = slide.audio
      audioRef.current.play().catch(e => console.log('Auto-play blocked:', e))
      setIsPlaying(true)
    } else if (isAutoPlay && !isPaused && !slide.has_audio) {
      // No audio - wait for slide duration then advance
      const duration = slide.duration * 1000
      autoPlayTimerRef.current = setTimeout(() => {
        if (currentSlide < totalSlides - 1) {
          setCurrentSlide(prev => prev + 1)
        } else {
          setIsAutoPlay(false)
        }
      }, duration)
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current)
      }
    }
  }, [currentSlide, isAutoPlay, isPaused])

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index)
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }

  const playAudio = () => {
    if (slide.audio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        setIsPaused(true)
      } else {
        audioRef.current.src = slide.audio
        audioRef.current.play()
        setIsPlaying(true)
        setIsPaused(false)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    // Auto-advance to next slide after audio ends
    if (isAutoPlay && !isPaused) {
      setTimeout(() => {
        if (currentSlide < totalSlides - 1) {
          setCurrentSlide(prev => prev + 1)
        } else {
          setIsAutoPlay(false) // End of presentation
        }
      }, 800) // Brief pause between slides
    }
  }

  const toggleAutoPlay = () => {
    if (isAutoPlay) {
      // Pause
      setIsAutoPlay(false)
      setIsPaused(true)
      if (audioRef.current && isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    } else {
      // Resume
      setIsAutoPlay(true)
      setIsPaused(false)
      // Resume audio if there's audio for current slide
      if (slide.has_audio && slide.audio && audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const getBackgroundClass = (bg: string) => {
    switch (bg) {
      case 'blackboard': return 'slide-bg-blackboard'
      case 'gradient-blue': return 'slide-bg-blue'
      case 'gradient-green': return 'slide-bg-green'
      case 'gradient-purple': return 'slide-bg-purple'
      case 'gradient-primary': return 'slide-bg-primary'
      case 'gradient-success': return 'slide-bg-success'
      case 'light': return 'slide-bg-light'
      case 'dark': return 'slide-bg-dark'
      case 'warning': return 'slide-bg-warning'
      default: return 'slide-bg-blackboard'
    }
  }

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'blackboard':
        return (
          <div className="slide-blackboard-content">
            <h2 className="blackboard-title">{slide.title || ''}</h2>
            <div className="blackboard-lines">
              {slide.lines?.map((line: string, i: number) => (
                <div 
                  key={i} 
                  className="blackboard-line"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  {formatMath(line)}
                </div>
              ))}
            </div>
          </div>
        )

      case 'title':
        return (
          <div className="slide-title-content">
            <div className="slide-title-badge">{slide.subtitle || 'Tutorial'}</div>
            <h1 className="slide-main-title">{slide.title}</h1>
            <div className="slide-title-decoration">
              <span></span><span></span><span></span>
            </div>
          </div>
        )

      case 'objectives':
        return (
          <div className="slide-objectives-content">
            <h2 className="slide-heading">{slide.title}</h2>
            <ul className="slide-bullets">
              {slide.bullets?.map((bullet, i) => (
                <li key={i} className="slide-bullet-item" style={{ animationDelay: `${i * 0.15}s` }}>
                  <span className="bullet-number">{i + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: renderTextWithMath(bullet) }} />
                </li>
              ))}
            </ul>
          </div>
        )

      case 'problem':
        return (
          <div className="slide-problem-content">
            <div className="slide-problem-label">📋 The Problem</div>
            <h2 className="slide-heading">{slide.title}</h2>
            {slide.subtitle && <div className="slide-topic-badge">{slide.subtitle}</div>}
            <div className="slide-problem-box">
              <p dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.content || '') }} />
            </div>
          </div>
        )

      case 'foundation':
        return (
          <div className="slide-foundation-content">
            <h2 className="slide-heading">{slide.title}</h2>
            <div className="slide-foundation-grid">
              {slide.bullets?.map((item, i) => (
                <div key={i} className="foundation-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="foundation-icon">📚</span>
                  <span dangerouslySetInnerHTML={{ __html: renderTextWithMath(item) }} />
                </div>
              ))}
            </div>
          </div>
        )

      case 'concept':
        return (
          <div className="slide-concept-content">
            <div className="concept-badge">💡 Key Concept</div>
            <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            {slide.concept_name && <p className="concept-name" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.concept_name) }} />}
            <div className="concept-visual">
              <p dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.content || '') }} />
            </div>
            {slide.key_insight && (
              <div className="concept-insight">
                <span className="insight-icon">✨</span>
                <span>{slide.key_insight}</span>
              </div>
            )}
          </div>
        )

      case 'step':
        return (
          <div className="slide-step-content">
            <div className="slide-step-header">
              <span className="slide-step-number">Step {slide.step_number}</span>
              <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            </div>
            {slide.what_we_do && (
              <div className="step-action">
                <span className="action-label">What we do:</span>
                <p dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.what_we_do) }} />
              </div>
            )}
            {slide.why_it_matters && (
              <div className="step-why">
                <span className="why-label">Why it matters:</span>
                <p>{slide.why_it_matters}</p>
              </div>
            )}
            {slide.math && (
              <div 
                className="slide-math"
                dangerouslySetInnerHTML={{ __html: renderMath(slide.math, true) }}
              />
            )}
            {slide.pro_tip && (
              <div className="step-pro-tip">
                <span className="pro-tip-icon">💎</span>
                <span><strong>Pro Tip:</strong> {slide.pro_tip}</span>
              </div>
            )}
          </div>
        )

      case 'warning':
        return (
          <div className="slide-warning-content">
            <div className="warning-icon-large">⚠️</div>
            <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            <div className="warning-box">
              <p dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.content || '') }} />
            </div>
          </div>
        )

      case 'checkpoint':
        return (
          <div className="slide-checkpoint-content">
            <div className="checkpoint-icon">🤔</div>
            <h2 className="slide-heading">Quick Check</h2>
            <div className="checkpoint-box">
              <p dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.content || '') }} />
            </div>
            <p className="checkpoint-subtitle">Take a moment to think about this...</p>
          </div>
        )

      case 'encouragement':
        return (
          <div className="slide-encouragement-content">
            <div className="encouragement-icon">🌟</div>
            <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            <p className="encouragement-text" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.content || '') }} />
          </div>
        )

      case 'answer':
        return (
          <div className="slide-answer-content">
            <div className="answer-celebration">🎉</div>
            <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            <div 
              className="slide-final-answer"
              dangerouslySetInnerHTML={{ __html: renderMath(slide.answer || '', true) }}
            />
            {slide.explanation && (
              <p className="answer-explanation">{slide.explanation}</p>
            )}
            <div className="slide-checkmark">✓</div>
          </div>
        )

      case 'summary':
        return (
          <div className="slide-summary-content">
            <h2 className="slide-heading" dangerouslySetInnerHTML={{ __html: renderTextWithMath(slide.title || '') }} />
            <div className="summary-grid">
              {slide.bullets?.map((bullet, i) => (
                <div key={i} className="summary-card" style={{ animationDelay: `${i * 0.15}s` }}>
                  <span className="summary-number">{i + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: renderTextWithMath(bullet) }} />
                </div>
              ))}
            </div>
            {slide.pattern && (
              <div className="pattern-recognition">
                <span className="pattern-icon">🔍</span>
                <span><strong>Pattern to recognize:</strong> {slide.pattern}</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="slideshow-player">
      <audio 
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="slideshow-header">
        <span className="slideshow-title">🎬 {slideshow.title}</span>
        <div className="slideshow-header-controls">
          <span className="slideshow-progress-text">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button className="slideshow-close" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="slideshow-progress-bar">
        <div 
          className="slideshow-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slide dots */}
      <div className="slideshow-dots">
        {slideshow.slides.map((_, i) => (
          <button
            key={i}
            className={`slideshow-dot ${i === currentSlide ? 'active' : ''} ${i < currentSlide ? 'completed' : ''}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Main slide area */}
      <div className={`slideshow-slide ${getBackgroundClass(slide.background)}`}>
        {renderSlideContent()}
        
        {/* Playing indicator */}
        {isPlaying && (
          <div className="slideshow-playing-indicator">
            <span className="playing-dot"></span>
            <span className="playing-dot"></span>
            <span className="playing-dot"></span>
            <span className="playing-text">Speaking...</span>
          </div>
        )}
      </div>

      {/* Controls - Video-like interface */}
      <div className="slideshow-controls">
        <button 
          className="slideshow-btn slideshow-btn-nav"
          onClick={() => goToSlide(currentSlide - 1)}
          disabled={currentSlide === 0}
          title="Previous slide"
        >
          ⏮️
        </button>

        <button 
          className={`slideshow-btn slideshow-btn-play ${isAutoPlay && !isPaused ? 'playing' : ''}`}
          onClick={toggleAutoPlay}
          title={isAutoPlay ? 'Pause presentation' : 'Play presentation'}
        >
          {isAutoPlay && !isPaused ? '⏸️' : '▶️'}
        </button>

        <button 
          className="slideshow-btn slideshow-btn-nav"
          onClick={() => goToSlide(currentSlide + 1)}
          disabled={currentSlide === totalSlides - 1}
          title="Next slide"
        >
          ⏭️
        </button>

        <div className="slideshow-controls-divider" />

        {slide.has_audio && (
          <button 
            className={`slideshow-btn slideshow-btn-audio ${isPlaying ? 'playing' : ''}`}
            onClick={playAudio}
            title={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? '🔊' : '🔈'}
          </button>
        )}

        <span className="slideshow-time">
          {currentSlide + 1} / {totalSlides}
        </span>
      </div>

      {/* Speaker notes - shows what's being narrated */}
      {slide.speaker_notes && (
        <div className="slideshow-notes">
          <span className="notes-label">🎤</span>
          <span className="notes-text">{slide.speaker_notes}</span>
        </div>
      )}
    </div>
  )
}

export default SlideshowPlayer
