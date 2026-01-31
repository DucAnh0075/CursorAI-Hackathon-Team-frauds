import { useState, useEffect } from 'react'
import { aiService, Explanation } from '../services/api'
import { videoGeneratorService, VideoSlide } from '../services/videoGenerator'
import SlideViewer from './SlideViewer'
import './VideoGenerator.css'

interface VideoGeneratorProps {
  inputText: string
  uploadedFile: File | null
  onGeneratingChange: (generating: boolean) => void
}

export default function VideoGenerator({
  inputText,
  uploadedFile,
  onGeneratingChange
}: VideoGeneratorProps) {
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [slides, setSlides] = useState<VideoSlide[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  useEffect(() => {
    onGeneratingChange(isGenerating)
  }, [isGenerating, onGeneratingChange])

  useEffect(() => {
    const generateVideo = async () => {
      if (!inputText && !uploadedFile) return

      setIsGenerating(true)
      setError(null)
      setCurrentSlideIndex(0)

      try {
        // Extract text from file or use input text
        let questionText = inputText

        if (uploadedFile) {
          // For now, we'll use the filename as the question
          // In production, you'd extract text from PDF/image using OCR
          questionText = `Exercise from ${uploadedFile.name}`
          // TODO: Implement PDF/image text extraction
        }

        // Generate explanation
        const explanationData = await aiService.generateExplanation(questionText)
        setExplanation(explanationData)

        // Generate slides
        const generatedSlides = await videoGeneratorService.generateSlides(
          explanationData,
          'Study Video'
        )
        setSlides(generatedSlides)
      } catch (err: any) {
        setError(err.message || 'Failed to generate video content')
        console.error('Generation error:', err)
      } finally {
        setIsGenerating(false)
      }
    }

    generateVideo()
  }, [inputText, uploadedFile])

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  if (isGenerating) {
    return (
      <div className="generator-loading">
        <div className="spinner"></div>
        <h3>Generating your study video...</h3>
        <p>This may take a moment</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="generator-error">
        <h3>❌ Error</h3>
        <p>{error}</p>
        <p className="error-hint">
          Make sure you have set your API key in the .env file:
          <br />
          VITE_MINIMAX_API_KEY=your_key or VITE_MANUS_API_KEY=your_key
        </p>
      </div>
    )
  }

  if (!explanation || slides.length === 0) {
    return null
  }

  return (
    <div className="video-generator">
      <div className="generator-header">
        <h2>Generated Study Video</h2>
        <div className="slide-counter">
          Slide {currentSlideIndex + 1} of {slides.length}
        </div>
      </div>

      <div className="slide-container">
        <SlideViewer slide={slides[currentSlideIndex]} />
      </div>

      <div className="slide-controls">
        <button
          onClick={handlePrevSlide}
          disabled={currentSlideIndex === 0}
          className="control-button"
        >
          ← Previous
        </button>
        <button
          onClick={handleNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="control-button"
        >
          Next →
        </button>
      </div>

      <div className="video-actions">
        <button className="action-button primary">Play Narration</button>
        <button className="action-button">Export Video</button>
      </div>
    </div>
  )
}
