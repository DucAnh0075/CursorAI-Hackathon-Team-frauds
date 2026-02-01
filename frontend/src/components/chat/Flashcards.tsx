import React, { useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { FlashcardSet } from '@/types/chat'
import './Flashcards.css'

interface Props {
  flashcardSets: FlashcardSet[]
  onClose: () => void
  onDeleteSet?: (setId: string) => void
}

// Render text with inline math ($ ... $)
function renderWithMath(content: string): string {
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
  
  return result
}

export const Flashcards: React.FC<Props> = ({
  flashcardSets,
  onClose,
  onDeleteSet
}) => {
  const [selectedSetIndex, setSelectedSetIndex] = useState(0)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [studyMode, setStudyMode] = useState<'browse' | 'study'>('browse')
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())

  if (flashcardSets.length === 0) {
    return (
      <div className="flashcards-container">
        <div className="flashcards-empty">
          <span className="flashcards-empty-icon">📚</span>
          <p>No flashcards yet!</p>
          <p className="flashcards-empty-hint">
            Use interactive mode and ask to create flashcards for any topic.
          </p>
          <button className="flashcards-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const currentSet = flashcardSets[selectedSetIndex]
  const currentCard = currentSet.cards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / currentSet.cards.length) * 100

  const handleNext = () => {
    setIsFlipped(false)
    setShowHint(false)
    if (currentCardIndex < currentSet.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setShowHint(false)
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
    }
  }

  const handleFlip = () => {
    setIsFlipped(prev => !prev)
  }

  const handleSelectSet = (index: number) => {
    setSelectedSetIndex(index)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setShowHint(false)
    setKnownCards(new Set())
  }

  const markAsKnown = () => {
    setKnownCards(prev => new Set([...prev, currentCard.id]))
    handleNext()
  }

  const markAsUnknown = () => {
    setKnownCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(currentCard.id)
      return newSet
    })
    handleNext()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4ade80'
      case 'medium': return '#fbbf24'
      case 'hard': return '#ef4444'
      default: return '#888'
    }
  }

  return (
    <div className="flashcards-container">
      {/* Header */}
      <div className="flashcards-header">
        <span className="flashcards-title">📚 Study Flashcards</span>
        <button className="flashcards-close" onClick={onClose}>×</button>
      </div>

      {/* Set selector (if multiple sets) */}
      {flashcardSets.length > 1 && (
        <div className="flashcards-sets">
          {flashcardSets.map((set, index) => (
            <button
              key={set.id}
              className={`flashcards-set-btn ${index === selectedSetIndex ? 'active' : ''}`}
              onClick={() => handleSelectSet(index)}
            >
              {set.topic_title}
            </button>
          ))}
        </div>
      )}

      {/* Set info */}
      <div className="flashcards-info">
        <h3>{currentSet.topic_title}</h3>
        <p>{currentSet.description}</p>
        <div className="flashcards-stats">
          <span>{currentSet.cards.length} cards</span>
          {studyMode === 'study' && (
            <span className="known-count">
              ✓ {knownCards.size} known
            </span>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flashcards-mode-toggle">
        <button 
          className={studyMode === 'browse' ? 'active' : ''} 
          onClick={() => setStudyMode('browse')}
        >
          📖 Browse
        </button>
        <button 
          className={studyMode === 'study' ? 'active' : ''} 
          onClick={() => setStudyMode('study')}
        >
          🎯 Study
        </button>
      </div>

      {/* Progress bar */}
      <div className="flashcards-progress">
        <div 
          className="flashcards-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flashcards-progress-text">
        Card {currentCardIndex + 1} of {currentSet.cards.length}
      </div>

      {/* Flashcard */}
      <div 
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <span 
              className="flashcard-difficulty"
              style={{ backgroundColor: getDifficultyColor(currentCard.difficulty) }}
            >
              {currentCard.difficulty}
            </span>
            <div 
              className="flashcard-content"
              dangerouslySetInnerHTML={{ __html: renderWithMath(currentCard.front) }}
            />
            <span className="flashcard-hint-text">Click to flip</span>
          </div>
          <div className="flashcard-back">
            <div 
              className="flashcard-content"
              dangerouslySetInnerHTML={{ __html: renderWithMath(currentCard.back) }}
            />
            <span className="flashcard-hint-text">Click to flip back</span>
          </div>
        </div>
      </div>

      {/* Hint button */}
      {currentCard.hint && !isFlipped && (
        <div className="flashcard-hint-section">
          {showHint ? (
            <div className="flashcard-hint-revealed">
              💡 {currentCard.hint}
            </div>
          ) : (
            <button 
              className="flashcard-hint-btn"
              onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
            >
              💡 Show Hint
            </button>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flashcards-controls">
        <button 
          className="flashcards-btn"
          onClick={handlePrev}
          disabled={currentCardIndex === 0}
        >
          ← Prev
        </button>

        {studyMode === 'study' && isFlipped && (
          <>
            <button 
              className="flashcards-btn flashcards-btn-unknown"
              onClick={markAsUnknown}
            >
              ❌ Again
            </button>
            <button 
              className="flashcards-btn flashcards-btn-known"
              onClick={markAsKnown}
            >
              ✓ Got it
            </button>
          </>
        )}

        <button 
          className="flashcards-btn"
          onClick={handleNext}
          disabled={currentCardIndex === currentSet.cards.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Study tips */}
      {currentSet.study_tips && (
        <div className="flashcards-tips">
          <strong>💡 Study Tips:</strong> {currentSet.study_tips}
        </div>
      )}

      {/* Delete set button */}
      {onDeleteSet && (
        <button 
          className="flashcards-delete-btn"
          onClick={() => onDeleteSet(currentSet.id)}
        >
          🗑️ Delete this set
        </button>
      )}
    </div>
  )
}

export default Flashcards
