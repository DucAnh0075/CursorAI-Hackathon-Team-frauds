export class Narrator {
  async textToSpeech(text: string): Promise<string> {
    // Use Web Speech API for browser-based TTS
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onend = () => {
          resolve('success')
        }

        utterance.onerror = (error) => {
          reject(error)
        }

        window.speechSynthesis.speak(utterance)
      } else {
        reject(new Error('Speech synthesis not supported in this browser'))
      }
    })
  }

  async generateAudioBlob(_text: string): Promise<Blob> {
    // For actual audio file generation, we'd need a backend service
    // or use a TTS API. For now, return empty blob as placeholder
    // In production, you'd call a TTS service or backend endpoint
    return new Blob([], { type: 'audio/mpeg' })
  }

  estimateDuration(text: string, wordsPerMinute: number = 150): number {
    const wordCount = text.split(/\s+/).length
    const durationMinutes = wordCount / wordsPerMinute
    return durationMinutes * 60
  }
}

export const narrator = new Narrator()
