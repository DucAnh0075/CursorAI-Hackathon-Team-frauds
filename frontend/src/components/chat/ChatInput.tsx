import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'
import { Send, X, Paperclip, FileText, Square, Loader2, Brain } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { ImageAttachment } from '@/types/chat'
import { chatService } from '@/services/chatService'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (message: string, images: ImageAttachment[], pdfTexts?: string[]) => void
  onStop?: () => void
  isLoading: boolean
  isWelcome?: boolean
  reasoningMode: boolean
  onToggleReasoningMode: () => void
}

interface PdfAttachment {
  id: string
  name: string
  text: string
  isLoading?: boolean
}

export function ChatInput({ onSend, onStop, isLoading, isWelcome, reasoningMode, onToggleReasoningMode }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [pdfAttachments, setPdfAttachments] = useState<PdfAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    if ((!message.trim() && attachments.length === 0 && pdfAttachments.length === 0) || isLoading) return
    
    // Get PDF texts to include in the message
    const pdfTexts = pdfAttachments.filter(p => !p.isLoading).map(p => p.text)
    
    onSend(message.trim(), attachments, pdfTexts.length > 0 ? pdfTexts : undefined)
    setMessage('')
    setAttachments([])
    setPdfAttachments([])
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [message, attachments, pdfAttachments, isLoading, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      // Handle images
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await addFile(file)
        }
      }
      // Handle files (PDF from clipboard is typically not supported, but we handle it just in case)
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of files) {
      await addFile(file)
    }

    // Reset input
    e.target.value = ''
  }

  const addFile = async (file: File): Promise<void> => {
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    
    if (!isImage && !isPDF) return

    if (isPDF) {
      // Handle PDF - upload to backend for text extraction
      const pdfId = crypto.randomUUID()
      setPdfAttachments(prev => [...prev, { id: pdfId, name: file.name, text: '', isLoading: true }])
      
      try {
        const extractedText = await chatService.uploadPdf(file)
        setPdfAttachments(prev => 
          prev.map(p => p.id === pdfId ? { ...p, text: extractedText, isLoading: false } : p)
        )
      } catch (error) {
        console.error('Failed to extract PDF text:', error)
        setPdfAttachments(prev => prev.filter(p => p.id !== pdfId))
        alert('Failed to read PDF. Please try again.')
      }
    } else {
      // Handle images
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const newAttachment: ImageAttachment = {
            id: crypto.randomUUID(),
            data: reader.result as string,
            name: file.name,
            type: file.type
          }
          setAttachments(prev => [...prev, newAttachment])
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const removePdfAttachment = (id: string) => {
    setPdfAttachments(prev => prev.filter(att => att.id !== id))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`chat-input ${isWelcome ? 'chat-input-welcome' : ''}`}>
      {(attachments.length > 0 || pdfAttachments.length > 0) && (
        <div className="chat-input-attachments">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="chat-input-attachment-preview">
              <img src={attachment.data} alt={attachment.name} />
              <button
                className="chat-input-attachment-remove"
                onClick={() => removeAttachment(attachment.id)}
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {pdfAttachments.map((pdf) => (
            <div key={pdf.id} className="chat-input-attachment-preview pdf">
              <div className="chat-input-pdf">
                {pdf.isLoading ? <Loader2 size={24} className="animate-spin" /> : <FileText size={24} />}
                <span>{pdf.name}</span>
              </div>
              <button
                className="chat-input-attachment-remove"
                onClick={() => removePdfAttachment(pdf.id)}
                aria-label="Remove PDF"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="chat-input-container">
        <button
          className="chat-input-attach"
          onClick={triggerFileInput}
          aria-label="Attach file"
          type="button"
        >
          <Paperclip size={20} />
        </button>
        
        {/* Reasoning Mode Toggle */}
        <button
          className={`chat-input-reasoning ${reasoningMode ? 'active' : ''}`}
          onClick={onToggleReasoningMode}
          aria-label="Reasoning Mode"
          type="button"
          title={reasoningMode ? "Interactive Mode: ON" : "Enable Interactive Mode"}
        >
          <Brain size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder={reasoningMode 
            ? "Interactive mode: I'll guide you step by step..." 
            : (isWelcome ? "Ask me anything... (paste screenshots or attach PDFs!)" : "Type your message...")}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          disabled={isLoading}
        />
        
        {isLoading ? (
          <Button
            variant="danger"
            size="md"
            onClick={onStop}
            icon={<Square size={16} fill="currentColor" />}
            aria-label="Stop generating"
          />
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!message.trim() && attachments.length === 0 && pdfAttachments.length === 0}
            icon={<Send size={18} />}
            aria-label="Send message"
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        onChange={handleFileSelect}
        className="chat-input-file"
      />

      <p className="chat-input-hint">
        {reasoningMode 
          ? "🧠 Interactive mode: step-by-step explanations with images and speech"
          : "Press Enter to send, Shift+Enter for new line"
        }
      </p>
    </div>
  )
}
