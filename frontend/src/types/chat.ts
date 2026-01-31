export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: ImageAttachment[]
  timestamp: Date
  isLoading?: boolean
}

export interface ImageAttachment {
  id: string
  data: string // Base64 encoded
  name: string
  type: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatRequest {
  message: string
  images?: string[]
  history?: Message[]
}

export interface ChatResponse {
  message: string
  success: boolean
  error?: string
}

export type Theme = 'dark' | 'light'
