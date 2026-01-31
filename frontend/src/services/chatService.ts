import axios from 'axios'
import { ChatResponse, Message } from '@/types/chat'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const chatService = {
  async sendMessage(
    message: string,
    images: string[] = [],
    history: Message[] = []
  ): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/chat/message', {
        message,
        images,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          images: msg.images?.map(img => img.data),
        })),
      })
      return response.data
    } catch (error) {
      console.error('Chat API error:', error)
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
}
