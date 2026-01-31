import { Explanation } from './api'
import { narrator } from './narrator'

export interface VideoSlide {
  type: 'title' | 'introduction' | 'step' | 'key-points' | 'conclusion'
  content: string
  stepNumber?: number
  keyPoints?: string[]
}

export class VideoGeneratorService {
  async generateSlides(explanation: Explanation, title: string): Promise<VideoSlide[]> {
    const slides: VideoSlide[] = []

    // Title slide
    slides.push({
      type: 'title',
      content: title
    })

    // Introduction slide
    if (explanation.introduction) {
      slides.push({
        type: 'introduction',
        content: explanation.introduction
      })
    }

    // Step slides
    explanation.steps.forEach((step) => {
      slides.push({
        type: 'step',
        content: step.text,
        stepNumber: parseInt(step.number)
      })
    })

    // Key points slide
    if (explanation.key_points.length > 0) {
      slides.push({
        type: 'key-points',
        content: 'Key Points',
        keyPoints: explanation.key_points
      })
    }

    // Conclusion slide
    if (explanation.conclusion) {
      slides.push({
        type: 'conclusion',
        content: explanation.conclusion
      })
    }

    return slides
  }

  async generateNarrationScript(explanation: Explanation): Promise<string> {
    const parts: string[] = []

    if (explanation.introduction) {
      parts.push(explanation.introduction)
    }

    explanation.steps.forEach((step) => {
      parts.push(`Step ${step.number}: ${step.text}`)
    })

    if (explanation.key_points.length > 0) {
      parts.push('Key points to remember:')
      explanation.key_points.forEach((point) => {
        parts.push(point)
      })
    }

    if (explanation.conclusion) {
      parts.push(explanation.conclusion)
    }

    return parts.join('\n\n')
  }

  async estimateVideoDuration(explanation: Explanation): Promise<number> {
    const script = await this.generateNarrationScript(explanation)
    return narrator.estimateDuration(script)
  }
}

export const videoGeneratorService = new VideoGeneratorService()
