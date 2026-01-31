import axios from 'axios'
import { ChatResponse, Message } from '@/types/chat'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

export const chatService = {
  async sendMessage(
    message: string,
    images: string[] = [],
    history: Message[] = [],
    model: string = 'openai'
  ): Promise<ChatResponse> {
    try {
      console.log(`[API Call] Sending message with model: ${model}`)
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
}
