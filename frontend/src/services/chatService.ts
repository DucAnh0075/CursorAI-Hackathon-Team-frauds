import axios from 'axios'
import { ChatResponse, Message } from '@/types/chat'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Get access code from localStorage or URL param
const getAccessCode = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const urlCode = urlParams.get('code')
  if (urlCode) {
    localStorage.setItem('access_code', urlCode)
    return urlCode
  }
  return localStorage.getItem('access_code') || ''
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add access code to all requests
api.interceptors.request.use((config) => {
  const accessCode = getAccessCode()
  if (accessCode) {
    config.headers['X-Access-Code'] = accessCode
  }
  return config
})

export interface VideoGenerationResponse {
  success: boolean
  task_id?: string
  status?: string
  message?: string
  video_url?: string
  error?: string
  estimated_time?: string
}

export interface StepData {
  step_number: number
  title: string
  explanation: string
  math_content: string
  visual_description: string
  key_insight: string
  generated_image?: string | null
}

export interface ExplanationResponse {
  problem_summary: string
  notation_used: string[]
  steps: StepData[]
  final_answer: string
  red_thread: string
}

// Interactive Reasoning types
export interface ReasoningStep {
  step_number: number
  title: string
  explanation: string
  math: string
  image_prompt: string
  key_insight: string
}

export interface ReasoningAnalysis {
  problem_summary: string
  total_steps: number
  steps: ReasoningStep[]
  final_answer: string
}

// Flashcard types
export interface Flashcard {
  id: number
  front: string
  back: string
  hint?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface FlashcardSet {
  id: string
  topic_title: string
  description: string
  cards: Flashcard[]
  study_tips: string
  createdAt: Date
}

// Slideshow types
export interface Slide {
  type: 'title' | 'objectives' | 'problem' | 'step' | 'answer' | 'summary'
  title: string
  subtitle?: string
  content?: string
  explanation?: string
  math?: string
  key_point?: string
  visual_description?: string
  bullets?: string[]
  answer?: string
  step_number?: number
  speaker_notes: string
  duration: number
  background: string
  audio?: string
  has_audio: boolean
}

export interface SlideshowComposition {
  id: string
  fps: number
  width: number
  height: number
  durationInFrames: number
  defaultProps: {
    title: string
    slides: Slide[]
    theme: {
      primaryColor: string
      secondaryColor: string
      backgroundColor: string
      textColor: string
      accentColor: string
      fontFamily: string
    }
    transitions: {
      type: string
      duration: number
    }
    animations: {
      textEntrance: string
      mathEntrance: string
      bulletEntrance: string
    }
  }
}

export interface SlideshowData {
  success: boolean
  slideshow_id: string
  title: string
  slides: Slide[]
  composition: SlideshowComposition
  total_slides: number
  estimated_duration: number
  error?: string
  message?: string
}

// Gambling Mode types
export interface GamblingScenario {
  outcome: string
  probability: string
  result: string
  larry_comment: string
}

export interface GamblingAnalysis {
  lucky_larry_says: string
  the_scenario: string
  probability_analysis: {
    win_probability: string
    lose_probability: string
    expected_value: string
    house_edge: string
  }
  gambler_pros: string[]
  reality_cons: string[]
  scenarios: GamblingScenario[]
  the_truth: string
  gambling_helpline: string
}

export const chatService = {
  async sendMessage(
    message: string,
    images: string[] = [],
    history: Message[] = [],
    model: string = 'openai',
    reasoningMode: boolean = false
  ): Promise<ChatResponse> {
    try {
      console.log(`[API Call] Sending message with model: ${model}, reasoning: ${reasoningMode}`)
      console.log(`[API Call] Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`)
      console.log(`[API Call] Images: ${images.length}`)
      
      const response = await api.post<ChatResponse>('/chat/message', {
        message,
        images,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          images: msg.images?.map(img => img.data),
        })),
        model,
        reasoning_mode: reasoningMode,
      })
      
      console.log(`[API Response] Received from ${model}:`, response.data.message.substring(0, 100))
      return response.data
    } catch (error) {
      console.error(`[API Error] Failed to call ${model} API:`, error)
      throw error
    }
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data.data
  },

  async uploadPdf(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data.data  // Returns extracted text
  },

  // Gambling Mode API
  async analyzeGamblingScenario(
    scenario: string,
    image?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<GamblingAnalysis> {
    try {
      console.log('[Gambling API] Analyzing scenario...')
      const response = await api.post<GamblingAnalysis>(
        '/gambling/analyze',
        { scenario, image, conversation_history: conversationHistory },
        { timeout: 60000 }
      )
      console.log('[Gambling API] Received analysis')
      return response.data
    } catch (error) {
      console.error('Gambling API error:', error)
      throw error
    }
  },

  // Video Generation APIs
  async generateVideo(
    topic: string,
    problemContext?: string,
    style: 'educational' | 'explainer' | 'tutorial' = 'educational'
  ): Promise<VideoGenerationResponse> {
    try {
      const response = await api.post<VideoGenerationResponse>('/video/generate', {
        topic,
        problem_context: problemContext,
        style,
      })
      return response.data
    } catch (error) {
      console.error('Video generation API error:', error)
      throw error
    }
  },

  async checkVideoStatus(taskId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await api.get<VideoGenerationResponse>(`/video/status/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Video status API error:', error)
      throw error
    }
  },

  async generateVideoSync(
    topic: string,
    problemContext?: string,
    style: 'educational' | 'explainer' | 'tutorial' = 'educational'
  ): Promise<VideoGenerationResponse> {
    try {
      const response = await api.post<VideoGenerationResponse>(
        '/video/generate-sync',
        {
          topic,
          problem_context: problemContext,
          style,
        },
        { timeout: 360000 } // 6 minute timeout for sync video generation
      )
      return response.data
    } catch (error) {
      console.error('Video generation sync API error:', error)
      throw error
    }
  },

  // Interactive Reasoning Mode APIs
  async analyzeForReasoning(
    problem: string,
    image?: string
  ): Promise<ReasoningAnalysis> {
    try {
      console.log('[Reasoning API] Analyzing problem...')
      const response = await api.post<ReasoningAnalysis>(
        '/reasoning/analyze',
        { problem, image },
        { timeout: 120000 }
      )
      console.log('[Reasoning API] Received', response.data.total_steps, 'steps')
      return response.data
    } catch (error) {
      console.error('Reasoning API error:', error)
      throw error
    }
  },

  async generateReasoningImage(imagePrompt: string): Promise<string | null> {
    try {
      const response = await api.post<{ image_url: string | null }>(
        '/reasoning/generate-image',
        { image_prompt: imagePrompt },
        { timeout: 60000 }
      )
      return response.data.image_url
    } catch (error) {
      console.error('Reasoning image API error:', error)
      return null
    }
  },

  async generateSpeech(text: string): Promise<string | null> {
    try {
      const response = await api.post<{ audio: string | null }>(
        '/reasoning/speak',
        { text },
        { timeout: 30000 }
      )
      return response.data.audio
    } catch (error) {
      console.error('Speech API error:', error)
      return null
    }
  },

  // Step-by-Step Explanation API
  async getStepByStepExplanation(
    problem: string,
    image?: string,
    notationContext?: string,
    generateImages: boolean = false
  ): Promise<ExplanationResponse> {
    try {
      console.log('[Explanation API] Requesting step-by-step explanation...')
      const response = await api.post<ExplanationResponse>(
        '/explain/solve',
        {
          problem,
          image,
          notation_context: notationContext,
          generate_images: generateImages,
        },
        { timeout: 180000 } // 3 minute timeout
      )
      console.log('[Explanation API] Received response with', response.data.steps.length, 'steps')
      return response.data
    } catch (error) {
      console.error('Explanation API error:', error)
      throw error
    }
  },

  async getQuickExplanation(
    problem: string,
    image?: string,
    notationContext?: string
  ): Promise<ExplanationResponse> {
    try {
      const response = await api.post<ExplanationResponse>(
        '/explain/quick-solve',
        {
          problem,
          image,
          notation_context: notationContext,
          generate_images: false,
        },
        { timeout: 120000 }
      )
      return response.data
    } catch (error) {
      console.error('Quick explanation API error:', error)
      throw error
    }
  },

  // Flashcard Generation API
  async generateFlashcards(
    topic: string,
    context?: string,
    image?: string,
    numCards: number = 5
  ): Promise<Omit<FlashcardSet, 'id' | 'createdAt'>> {
    try {
      console.log('[Flashcard API] Generating flashcards...')
      const response = await api.post<Omit<FlashcardSet, 'id' | 'createdAt'>>(
        '/flashcards/generate',
        { topic, context, image, num_cards: numCards },
        { timeout: 60000 }
      )
      console.log('[Flashcard API] Generated', response.data.cards.length, 'cards')
      return response.data
    } catch (error) {
      console.error('Flashcard API error:', error)
      throw error
    }
  },

  // Slideshow Generation API
  async generateSlideshow(
    problem: string,
    image?: string,
    reasoningAnalysis?: ReasoningAnalysis
  ): Promise<SlideshowData> {
    try {
      console.log('[Slideshow API] Generating slideshow...')
      const response = await api.post<SlideshowData>(
        '/slideshow/generate',
        { problem, image, reasoning_analysis: reasoningAnalysis },
        { timeout: 120000 }
      )
      console.log('[Slideshow API] Generated', response.data.total_slides, 'slides')
      return response.data
    } catch (error) {
      console.error('Slideshow API error:', error)
      throw error
    }
  },
}
