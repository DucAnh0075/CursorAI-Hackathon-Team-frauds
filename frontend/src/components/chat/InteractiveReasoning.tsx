import React, { useState, useEffect } from 'react'
import { chatService, SlideshowData } from '@/services/chatService'
import { FlashcardSet } from '@/types/chat'
import { SlideshowPlayer } from './SlideshowPlayer'
import './InteractiveReasoning.css'

interface Props {
  problem: string
  image?: string
  onComplete: () => void
  onCancel: () => void
  onCreateFlashcards?: (flashcardSet: FlashcardSet) => void
  onCreateSlideshow?: (slideshow: SlideshowData) => void
}

export const InteractiveReasoning: React.FC<Props> = ({
  problem,
  image,
  onComplete,
  onCancel,
  onCreateFlashcards,
}) => {
  const [slideshow, setSlideshow] = useState<SlideshowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingFlashcards, setCreatingFlashcards] = useState(false)

  // Generate slideshow immediately on mount
  useEffect(() => {
    const generateVideo = async () => {
      try {
        setLoading(true)
        const result = await chatService.generateSlideshow(problem, image)
        
        if (result.success) {
          setSlideshow(result)
        } else {
          setError('Failed to generate video. Please try again.')
        }
      } catch (err) {
        setError('Failed to generate video. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    generateVideo()
  }, [problem, image])

  const handleCreateFlashcards = async () => {
    if (!onCreateFlashcards) return
    
    try {
      setCreatingFlashcards(true)
      
      const result = await chatService.generateFlashcards(
        problem,
        `Problem: ${problem}`,
        image,
        5
      )
      
      const flashcardSet: FlashcardSet = {
        id: crypto.randomUUID(),
        topic_title: result.topic_title,
        description: result.description,
        cards: result.cards,
        study_tips: result.study_tips,
        createdAt: new Date()
      }
      
      onCreateFlashcards(flashcardSet)
    } catch (err) {
      console.error('Failed to create flashcards:', err)
    } finally {
      setCreatingFlashcards(false)
    }
  }

  if (loading) {
    return (
      <div className="reasoning-container">
        <div className="reasoning-loading">
          <div className="reasoning-spinner" />
          <span>Generating video lesson...</span>
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

  if (!slideshow) return null

  return (
    <div className="reasoning-video-container">
      {/* The slideshow player */}
      <SlideshowPlayer 
        slideshow={slideshow} 
        onClose={onComplete}
      />
      
      {/* Bottom action bar */}
      <div className="reasoning-action-bar">
        {onCreateFlashcards && (
          <button 
            className="reasoning-btn reasoning-btn-flashcards"
            onClick={handleCreateFlashcards}
            disabled={creatingFlashcards}
          >
            {creatingFlashcards ? '📚 Creating Flashcards...' : '📚 Create Flashcards'}
          </button>
        )}
      </div>
    </div>
  )
}

export default InteractiveReasoning
