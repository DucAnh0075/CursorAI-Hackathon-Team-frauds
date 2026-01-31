import axios from 'axios'

export interface Explanation {
  introduction: string
  steps: Array<{ number: string; text: string }>
  key_points: string[]
  conclusion: string
}

class AIService {
  private getApiKey(): string | null {
    // Get API key from environment or user input
    const minimaxKey = import.meta.env.VITE_MINIMAX_API_KEY
    const manusKey = import.meta.env.VITE_MANUS_API_KEY
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

    return minimaxKey || manusKey || openaiKey || null
  }

  private detectProvider(): 'minimax' | 'manus' | 'openai' | null {
    if (import.meta.env.VITE_MINIMAX_API_KEY) return 'minimax'
    if (import.meta.env.VITE_MANUS_API_KEY) return 'manus'
    if (import.meta.env.VITE_OPENAI_API_KEY) return 'openai'
    return null
  }

  async generateExplanation(question: string): Promise<Explanation> {
    const provider = this.detectProvider()
    const apiKey = this.getApiKey()

    if (!provider || !apiKey) {
      throw new Error('No API key configured. Please set VITE_MINIMAX_API_KEY, VITE_MANUS_API_KEY, or VITE_OPENAI_API_KEY in .env file')
    }

    const prompt = `You are an expert teacher creating an educational video explanation. 

Question/Exercise:
${question}

Create a clear, step-by-step explanation that would be suitable for a study video. 
Structure your response as follows:

1. Introduction: A brief overview of what we'll solve (2-3 sentences)
2. Step-by-step solution: Break down the solution into clear, numbered steps
3. Key points: List 2-3 important concepts or takeaways
4. Conclusion: A brief summary (1-2 sentences)

Make the explanation engaging, clear, and educational. Use simple language but be thorough.
Format your response in a way that's easy to narrate in a video.`

    try {
      if (provider === 'minimax') {
        return await this.callMinimax(prompt)
      } else if (provider === 'manus') {
        return await this.callManus(prompt)
      } else {
        return await this.callOpenAI(prompt)
      }
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  private async callMinimax(prompt: string): Promise<Explanation> {
    const apiKey = import.meta.env.VITE_MINIMAX_API_KEY
    const groupId = import.meta.env.VITE_MINIMAX_GROUP_ID || ''

    const url = 'https://api.minimax.chat/v1/text/chatcompletion_pro'
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }

    const payload: any = {
      model: 'abab6.5s-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator who makes clear, engaging explanations for students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }

    if (groupId) {
      payload.group_id = groupId
    }

    try {
      const response = await axios.post(url, payload, { headers, timeout: 30000 })
      const result = response.data

      let content = ''
      if (result.choices && result.choices.length > 0) {
        content = result.choices[0].message?.content || result.choices[0].text || ''
      } else if (result.reply) {
        content = result.reply
      } else if (result.content) {
        content = result.content
      }

      return this.parseExplanation(content)
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Try alternative auth
        headers['api-key'] = apiKey
        delete headers['Authorization']
        const response = await axios.post(url, payload, { headers, timeout: 30000 })
        const result = response.data
        const content = result.choices?.[0]?.message?.content || result.reply || ''
        return this.parseExplanation(content)
      }
      throw error
    }
  }

  private async callManus(prompt: string): Promise<Explanation> {
    const apiKey = import.meta.env.VITE_MANUS_API_KEY
    const url = 'https://api.manus.ai/v1/chat/completions'
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }

    const payload = {
      model: 'manus-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator who makes clear, engaging explanations for students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }

    const response = await axios.post(url, payload, { headers, timeout: 30000 })
    const result = response.data

    let content = ''
    if (result.choices && result.choices.length > 0) {
      content = result.choices[0].message?.content || ''
    } else if (result.content) {
      content = result.content
    } else if (result.text) {
      content = result.text
    }

    return this.parseExplanation(content)
  }

  private async callOpenAI(prompt: string): Promise<Explanation> {
    // For OpenAI, we'd need to use their SDK or make direct API calls
    // Since we're in browser, we'll use axios
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const url = 'https://api.openai.com/v1/chat/completions'

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator who makes clear, engaging explanations for students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }

    const response = await axios.post(url, payload, { headers, timeout: 30000 })
    const content = response.data.choices[0].message.content

    return this.parseExplanation(content)
  }

  private parseExplanation(content: string): Explanation {
    const result: Explanation = {
      introduction: '',
      steps: [],
      key_points: [],
      conclusion: ''
    }

    // Extract introduction
    const introMatch = content.match(/(?:Introduction|Overview)[:\.]?\s*(.+?)(?=\n\s*(?:Step|Key|Conclusion)|$)/is)
    if (introMatch) {
      result.introduction = introMatch[1].trim()
    }

    // Extract steps
    const stepPattern = /(?:Step\s+)?(\d+)[\.\)]\s*(.+?)(?=\n\s*(?:\d+[\.\)]|Step|Key|Conclusion)|$)/gis
    let stepMatch
    while ((stepMatch = stepPattern.exec(content)) !== null) {
      result.steps.push({
        number: stepMatch[1],
        text: stepMatch[2].trim()
      })
    }

    // Extract key points
    const keyPointsMatch = content.match(/(?:Key\s+points?|Takeaways?)[:\.]?\s*(.+?)(?=\n\s*(?:Conclusion|$))/is)
    if (keyPointsMatch) {
      const pointsText = keyPointsMatch[1]
      const points = pointsText.match(/[•\-\*]\s*(.+?)(?=\n|$)/g) || []
      result.key_points = points.map(p => p.replace(/^[•\-\*]\s*/, '').trim()).filter(p => p)
    }

    // Extract conclusion
    const conclusionMatch = content.match(/(?:Conclusion|Summary)[:\.]?\s*(.+?)$/is)
    if (conclusionMatch) {
      result.conclusion = conclusionMatch[1].trim()
    }

    // Fallback: if no steps found, split by paragraphs
    if (result.steps.length === 0) {
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      paragraphs.slice(0, 5).forEach((para, i) => {
        result.steps.push({
          number: String(i + 1),
          text: para.trim()
        })
      })
    }

    return result
  }
}

export const aiService = new AIService()
