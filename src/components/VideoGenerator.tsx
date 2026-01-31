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
  const [isPlayingNarration, setIsPlayingNarration] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string>('')
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

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

        // Generate AI video using Minimax (limited to 5 seconds for testing)
        await generateMinimaxVideo(explanationData)
      } catch (err: any) {
        setError(err.message || 'Failed to generate video content')
        console.error('Generation error:', err)
      } finally {
        setIsGenerating(false)
      }
    }

    generateVideo()
  }, [inputText, uploadedFile])

  const generateMinimaxVideo = async (explanation: Explanation) => {
    try {
      setIsGeneratingVideo(true)
      setVideoGenerationStatus('Creating video generation task...')
      setGeneratedVideoUrl(null)

      // Check if Minimax API key is available
      const minimaxKey = import.meta.env.VITE_MINIMAX_API_KEY
      if (!minimaxKey) {
        setVideoGenerationStatus('Minimax API key not configured. Skipping video generation.')
        return
      }

      // Create a concise description for video generation
      const videoDescription = [
        explanation.introduction,
        ...explanation.steps.map(s => `Step ${s.number}: ${s.text}`),
        explanation.conclusion
      ].filter(Boolean).join('. ').substring(0, 500) // Limit prompt length

      const minimaxVideoModule = await import('../services/minimaxVideo')

      const videoUrl = await minimaxVideoModule.minimaxVideoService.generateVideo(
        videoDescription,
        5, // 5 seconds for testing
        (status: { status: string }) => {
          console.log('Video generation status:', status)
          setVideoGenerationStatus(`Status: ${status.status}...`)
        }
      )

      console.log('✅ Video URL received:', videoUrl)
      setGeneratedVideoUrl(videoUrl)
      setVideoGenerationStatus('Video generated successfully! Click play to watch.')
    } catch (err: any) {
      console.error('Minimax video generation error:', err)
      setVideoGenerationStatus(`Error: ${err.message}. Video generation is optional - slides are still available.`)
      // Don't block the UI if video generation fails
    } finally {
      setIsGeneratingVideo(false)
    }
  }

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

  const handlePlayNarration = async () => {
    if (!explanation) return

    setIsPlayingNarration(true)
    try {
      const { narrator } = await import('../services/narrator')
      const script = await videoGeneratorService.generateNarrationScript(explanation)
      await narrator.textToSpeech(script)
    } catch (err: any) {
      console.error('Narration error:', err)
      alert('Narration failed: ' + err.message)
    } finally {
      setIsPlayingNarration(false)
    }
  }

  const handleExportVideo = async () => {
    if (!explanation || slides.length === 0) return

    setIsExporting(true)
    try {
      // Use html2canvas to capture actual rendered slides
      await exportVideoFileUsingHTML2Canvas(slides)
    } catch (err: any) {
      console.error('Export error:', err)
      alert('Video export failed: ' + err.message + '\n\nTry using the Minimax AI video generation instead.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportVideoFileUsingHTML2Canvas = async (slides: VideoSlide[]) => {
    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default
    
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    canvas.style.position = 'fixed'
    canvas.style.left = '-9999px'
    canvas.style.top = '0'
    document.body.appendChild(canvas)
    
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      document.body.removeChild(canvas)
      throw new Error('Could not get canvas context')
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const stream = canvas.captureStream(30)
    
    let mimeType = 'video/webm;codecs=vp9'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error('Video recording is not supported in this browser')
        }
      }
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []
    let recordingComplete = false

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
        console.log('📹 Video chunk received:', e.data.size, 'bytes')
      }
    }

    mediaRecorder.onstop = () => {
      if (recordingComplete) return
      recordingComplete = true
      
      if (canvas.parentNode) {
        document.body.removeChild(canvas)
      }
      
      if (chunks.length === 0) {
        console.error('❌ No video data recorded!')
        alert('Video recording failed: No data was captured.')
        return
      }
      
      const blob = new Blob(chunks, { type: mimeType })
      console.log('✅ Video blob created:', (blob.size / 1024).toFixed(2), 'KB')
      
      if (blob.size < 1000) {
        alert('⚠️ Warning: Video file is very small. It might be empty or corrupted.')
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study-video-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    mediaRecorder.onerror = (e: any) => {
      console.error('❌ Recording error:', e)
      throw new Error('Recording error: ' + e.error)
    }

    mediaRecorder.start(100)

    // Wait for recorder to initialize
    await new Promise(resolve => setTimeout(resolve, 200))

    // Find the slide container element
    const slideContainer = document.querySelector('.slide-container')
    if (!slideContainer) {
      throw new Error('Slide container not found')
    }

    // Render each slide
    for (let i = 0; i < slides.length; i++) {
      // Temporarily show the slide we want to capture
      setCurrentSlideIndex(i)
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for React to render
      
      // Capture the slide using html2canvas
      try {
        const slideElement = slideContainer.querySelector('.slide')
        if (slideElement) {
          const slideCanvas = await html2canvas(slideElement as HTMLElement, {
            width: 1920,
            height: 1080,
            scale: 1,
            useCORS: true,
            backgroundColor: '#f8f9fa'
          })
          
          // Draw the captured slide to our recording canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(slideCanvas, 0, 0, canvas.width, canvas.height)
          
          // Force frame capture
          ctx.getImageData(0, 0, 1, 1)
        }
      } catch (err) {
        console.error('Error capturing slide:', err)
        // Fallback to canvas rendering
        renderSlideToCanvas(ctx, slides[i], canvas.width, canvas.height)
      }
      
      // Record for 3 seconds (90 frames at 30fps)
      const frames = 90
      for (let frame = 0; frame < frames; frame++) {
        await new Promise(resolve => setTimeout(resolve, 1000 / 30))
      }
    }

    mediaRecorder.stop()
    
    // Wait for recording to complete
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video recording timeout'))
      }, 15000)
      
      const checkComplete = () => {
        if (recordingComplete) {
          clearTimeout(timeout)
          resolve(true)
        } else {
          setTimeout(checkComplete, 100)
        }
      }
      checkComplete()
    })
  }

  const renderSlideToCanvas = (ctx: CanvasRenderingContext2D, slide: VideoSlide, width: number, height: number) => {
    // Clear and set whiteboard style background
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, width, height)

    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Set default text style
    ctx.textBaseline = 'top'

    switch (slide.type) {
      case 'title':
        // Dark professional background
        const titleGradient = ctx.createLinearGradient(0, 0, 0, height)
        titleGradient.addColorStop(0, '#2c3e50')
        titleGradient.addColorStop(1, '#34495e')
        ctx.fillStyle = titleGradient
        ctx.fillRect(0, 0, width, height)
        
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.font = 'bold 100px Arial, sans-serif'
        ctx.fillText(slide.content, width / 2, height / 2 - 80)
        ctx.font = '40px Arial, sans-serif'
        ctx.fillText('Educational Explanation', width / 2, height / 2 + 40)
        break

      case 'introduction':
      case 'conclusion':
        ctx.textAlign = 'left'
        const heading = slide.type === 'introduction' ? 'Introduction' : 'Conclusion'
        
        // Heading with underline
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 70px Arial, sans-serif'
        ctx.fillText(heading, 200, 150)
        
        // Underline
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(200, 240)
        ctx.lineTo(200 + ctx.measureText(heading).width, 240)
        ctx.stroke()
        
        // Content box
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(200, 280, width - 400, height - 350)
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 4
        ctx.strokeRect(200, 280, width - 400, height - 350)
        
        ctx.fillStyle = '#2c3e50'
        ctx.font = '42px Arial, sans-serif'
        wrapText(ctx, slide.content, 250, 320, width - 500, 50)
        break

      case 'step':
        ctx.textAlign = 'left'
        
        // Step badge
        ctx.fillStyle = '#3498db'
        ctx.fillRect(200, 150, 250, 80)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 50px Arial, sans-serif'
        ctx.fillText(`Step ${slide.stepNumber}`, 220, 170)
        
        // Content box
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(200, 280, width - 400, height - 350)
        ctx.strokeStyle = '#3498db'
        ctx.lineWidth = 4
        ctx.strokeRect(200, 280, width - 400, height - 350)
        
        ctx.fillStyle = '#34495e'
        ctx.font = '42px Arial, sans-serif'
        wrapText(ctx, slide.content, 250, 320, width - 500, 50)
        break

      case 'key-points':
        ctx.textAlign = 'left'
        
        // Heading
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 70px Arial, sans-serif'
        ctx.fillText('Key Points', 200, 150)
        
        // Underline
        ctx.strokeStyle = '#27ae60'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(200, 240)
        ctx.lineTo(200 + ctx.measureText('Key Points').width, 240)
        ctx.stroke()
        
        // Key points list
        let y = 300
        slide.keyPoints?.forEach((point) => {
          // Point box
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(200, y, width - 400, 100)
          ctx.strokeStyle = '#27ae60'
          ctx.lineWidth = 4
          ctx.strokeRect(200, y, width - 400, 100)
          
          // Bullet and text
          ctx.fillStyle = '#27ae60'
          ctx.font = 'bold 50px Arial, sans-serif'
          ctx.fillText('•', 230, y + 25)
          
          ctx.fillStyle = '#2c3e50'
          ctx.font = '42px Arial, sans-serif'
          wrapText(ctx, point, 280, y + 20, width - 500, 50)
          
          y += 120
        })
        break
    }
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ')
    let line = ''
    let currentY = y

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY)
        line = words[n] + ' '
        currentY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, currentY)
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

      {/* Minimax AI Generated Video */}
      {isGeneratingVideo && (
        <div className="video-generation-status">
          <div className="spinner"></div>
          <p>{videoGenerationStatus}</p>
          <p className="status-hint">Generating AI video with Minimax (5 seconds, limited for testing)...</p>
        </div>
      )}

      {generatedVideoUrl && (
        <div className="generated-video-container">
          <h3>🎬 AI Generated Video (Minimax)</h3>
          <video 
            src={generatedVideoUrl} 
            controls 
            autoPlay
            onError={(e) => {
              console.error('Video playback error:', e)
              setVideoGenerationStatus('Error: Video could not be played. Check console for details.')
            }}
            onLoadedData={() => {
              console.log('✅ Video loaded successfully!')
              setVideoGenerationStatus('Video loaded and ready to play!')
            }}
            style={{
              width: '100%',
              maxWidth: '900px',
              borderRadius: '8px',
              marginTop: '1rem',
              backgroundColor: '#000'
            }}
          >
            Your browser does not support the video tag.
          </video>
          <p className="video-status">{videoGenerationStatus}</p>
          <p className="video-url-hint">Video URL: {generatedVideoUrl.substring(0, 80)}...</p>
        </div>
      )}

      <div className="video-actions">
        <button 
          className="action-button primary" 
          onClick={handlePlayNarration}
          disabled={isPlayingNarration}
        >
          {isPlayingNarration ? 'Playing...' : 'Play Narration'}
        </button>
        <button 
          className="action-button" 
          onClick={handleExportVideo}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Video'}
        </button>
      </div>
    </div>
  )
}
