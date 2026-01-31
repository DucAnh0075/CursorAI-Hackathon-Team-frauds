import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

export interface VideoGenerationTask {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_id?: string
  video_url?: string
  error?: string
  local_path?: string
}

export class MinimaxVideoService {
  private apiKey: string
  // Video API uses different domain than chat API
  // Chat API: api.minimax.chat
  // Video API: api.minimax.io (CONFIRMED WORKING)
  private baseUrl = 'https://api.minimax.io/v1' // Video API endpoint

  constructor() {
    const key = import.meta.env.VITE_MINIMAX_API_KEY
    if (!key) {
      throw new Error('VITE_MINIMAX_API_KEY is not set')
    }
    this.apiKey = key
  }

  /**
   * Create a text-to-video generation task
   * @param prompt Text description for video generation
   * @param maxDuration Maximum video duration in seconds (for testing, limit to 5-10 seconds)
   */
  async createVideoTask(prompt: string, maxDuration: number = 5): Promise<string> {
    // Try the standard Minimax video API endpoint
    const url = `${this.baseUrl}/video_generation`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }

    // Create a concise prompt for short video
    const videoPrompt = `Create a short ${maxDuration}-second educational video explaining: ${prompt}. Make it clear, engaging, and suitable for students.`

    // Try different payload formats based on Minimax API documentation
    const payload: any = {
      model: 'video-01', // Minimax video model
      prompt: videoPrompt,
      duration: maxDuration, // Limit duration for testing
      aspect_ratio: '16:9',
      resolution: '720p' // Lower resolution for faster generation and testing
    }

    // Add group_id if available (similar to chat API)
    const groupId = import.meta.env.VITE_MINIMAX_GROUP_ID
    if (groupId) {
      payload.group_id = groupId
    }

    try {
      console.log('📤 Creating Minimax video task:', { url, payload: JSON.stringify(payload) })
      const response = await axios.post(url, payload, { headers, timeout: 60000 })
      const result = response.data
      console.log('📥 Minimax response:', result)

      if (result.task_id) {
        console.log('✅ Task ID received:', result.task_id)
        return result.task_id
      } else if (result.id) {
        console.log('✅ Task ID received (id field):', result.id)
        return result.id
      } else {
        console.error('❌ Unexpected response format:', result)
        throw new Error('No task_id received from Minimax API. Response: ' + JSON.stringify(result))
      }
    } catch (error: any) {
      console.error('❌ Minimax video creation error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })

      // Provide helpful error messages
      if (error.response?.status === 404) {
        throw new Error('Video generation endpoint not found. The API endpoint might be incorrect or video generation may not be available for your account.')
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your VITE_MINIMAX_API_KEY.')
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden. Video generation may not be enabled for your API key.')
      }

      throw new Error(`Failed to create video task: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check the status of a video generation task
   * Note: Status endpoint format is unclear - trying multiple formats
   */
  async checkTaskStatus(taskId: string): Promise<VideoGenerationTask> {
    // Use confirmed working endpoint: GET /v1/query/video_generation?task_id=xxx
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: { task_id: taskId },
        timeout: 30000
      }

      const response = await axios.get(`${this.baseUrl}/query/video_generation`, config)
      const result = response.data

      if (result.base_resp?.status_code !== 0) {
        throw new Error(result.base_resp?.status_msg || 'Status check failed')
      }

      // Get video URL from file_id
      let videoUrl: string | undefined
      if (result.file_id) {
        try {
          const fileResponse = await axios.get(
            `${this.baseUrl}/files/retrieve`,
            {
              ...config,
              params: { file_id: result.file_id }
            }
          )
          videoUrl = fileResponse.data.file?.download_url
        } catch (fileError) {
          console.warn('Could not retrieve video URL:', fileError)
        }
      }

      const status = result.status?.toLowerCase() === 'success' ? 'completed' : 
                     result.status?.toLowerCase() === 'processing' ? 'processing' :
                     result.status?.toLowerCase() === 'failed' ? 'failed' : 'pending'

      return {
        task_id: taskId,
        status,
        file_id: result.file_id,
        video_url: videoUrl,
        error: result.error
      }
    } catch (error: any) {
      console.error('Status check failed:', error.response?.data || error.message)
      return {
        task_id: taskId,
        status: 'failed',
        error: error.message
      }
    }
  }

  /**
   * Poll for video completion with progress updates
   */
  async waitForVideoCompletion(
    taskId: string,
    onProgress?: (status: VideoGenerationTask) => void,
    maxWaitTime: number = 300000 // 5 minutes max
  ): Promise<VideoGenerationTask> {
    const startTime = Date.now()
    const pollInterval = 3000 // Check every 3 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkTaskStatus(taskId)

      if (onProgress) {
        onProgress(status)
      }

      if (status.status === 'completed' && status.video_url) {
        return status
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Video generation failed')
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Video generation timeout - exceeded maximum wait time')
  }

  /**
   * Generate video from explanation (full workflow)
   */
  async generateVideo(
    explanation: string,
    maxDuration: number = 5,
    onProgress?: (status: VideoGenerationTask) => void
  ): Promise<string> {
    // Create task
    const taskId = await this.createVideoTask(explanation, maxDuration)

    // Wait for completion
    const result = await this.waitForVideoCompletion(taskId, onProgress)

    if (!result.video_url) {
      throw new Error('Video URL not available')
    }

    return result.video_url
  }

  /**
   * Download video from URL and save locally
   */
  async downloadVideo(
    videoUrl: string,
    taskId: string,
    outputDir: string = './videos'
  ): Promise<string> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    console.log('📥 Downloading video from Minimax...')

    try {
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000 // 2 minutes
      })

      const filename = `video_${taskId}_${Date.now()}.mp4`
      const filepath = path.join(outputDir, filename)

      fs.writeFileSync(filepath, Buffer.from(response.data))

      const sizeMB = (response.data.byteLength / 1024 / 1024).toFixed(2)
      console.log(`✅ Video saved to: ${filepath} (${sizeMB} MB)`)

      return filepath
    } catch (error: any) {
      throw new Error(`Failed to download video: ${error.message}`)
    }
  }

  /**
   * Generate video and download it locally (full workflow with download)
   */
  async generateAndDownloadVideo(
    explanation: string,
    maxDuration: number = 5,
    outputDir: string = './videos',
    onProgress?: (status: VideoGenerationTask) => void
  ): Promise<{ videoUrl: string; localPath: string }> {
    // Generate video
    const videoUrl = await this.generateVideo(explanation, maxDuration, onProgress)

    // Download it
    const localPath = await this.downloadVideo(videoUrl, videoUrl, outputDir)

    return { videoUrl, localPath }
  }
}

export const minimaxVideoService = new MinimaxVideoService()
