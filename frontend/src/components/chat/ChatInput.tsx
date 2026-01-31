import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'
import { Send, X, Paperclip, FileText, Square } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { ImageAttachment } from '@/types/chat'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (message: string, images: ImageAttachment[]) => void
  onStop?: () => void
  isLoading: boolean
  isWelcome?: boolean
}

export function ChatInput({ onSend, onStop, isLoading, isWelcome }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    if ((!message.trim() && attachments.length === 0) || isLoading) return
    
    onSend(message.trim(), attachments)
    setMessage('')
    setAttachments([])
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [message, attachments, isLoading, onSend])

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

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const isPDF = (type: string) => type === 'application/pdf'

  return (
    <div className={`chat-input ${isWelcome ? 'chat-input-welcome' : ''}`}>
      {attachments.length > 0 && (
        <div className="chat-input-attachments">
          {attachments.map((attachment) => (
            <div key={attachment.id} className={`chat-input-attachment-preview ${isPDF(attachment.type) ? 'pdf' : ''}`}>
              {isPDF(attachment.type) ? (
                <div className="chat-input-pdf">
                  <FileText size={24} />
                  <span>{attachment.name}</span>
                </div>
              ) : (
                <img src={attachment.data} alt={attachment.name} />
              )}
              <button
                className="chat-input-attachment-remove"
                onClick={() => removeAttachment(attachment.id)}
                aria-label="Remove attachment"
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
        
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder={isWelcome ? "Ask me anything... (paste screenshots or attach PDFs!)" : "Type your message..."}
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
            disabled={!message.trim() && attachments.length === 0}
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
        Press Enter to send, Shift+Enter for new line. Paste screenshots or attach PDFs.
      </p>
    </div>
  )
}
