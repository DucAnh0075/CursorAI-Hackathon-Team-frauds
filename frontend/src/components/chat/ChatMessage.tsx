import { Message } from '@/types/chat'
import { User, Sparkles } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './ChatMessage.css'

interface ChatMessageProps {
  message: Message
}

// Render all math expressions using KaTeX
function renderContent(content: string): string {
  let result = content
  
  // Convert \[ \] to display math markers (before HTML escaping)
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, '%%DISPLAY%%$1%%/DISPLAY%%')
  
  // Convert \( \) to inline math markers  
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, '%%INLINE%%$1%%/INLINE%%')
  
  // Also handle $$ ... $$ for display math
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, '%%DISPLAY%%$1%%/DISPLAY%%')
  
  // Also handle $ ... $ for inline math (but not \$)
  result = result.replace(/(?<!\\)\$([^$\n]+?)\$/g, '%%INLINE%%$1%%/INLINE%%')
  
  // Escape HTML for non-math content only
  // Split by markers, escape non-math parts, then rejoin
  const parts = result.split(/(%%(?:DISPLAY|INLINE)%%[\s\S]*?%%\/(?:DISPLAY|INLINE)%%)/g)
  result = parts.map(part => {
    if (part.startsWith('%%DISPLAY%%') || part.startsWith('%%INLINE%%')) {
      return part // Don't escape math content
    }
    return part
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }).join('')
  
  // Render display math
  result = result.replace(/%%DISPLAY%%([\s\S]*?)%%\/DISPLAY%%/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
    } catch {
      return math
    }
  })
  
  // Render inline math
  result = result.replace(/%%INLINE%%([\s\S]*?)%%\/INLINE%%/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return math
    }
  })
  
  // Convert markdown-style formatting
  // Bold **text**
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  // Code `text`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convert headers
  result = result.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  result = result.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  result = result.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  
  // Convert lists
  result = result.replace(/^- (.*?)$/gm, '<li>$1</li>')
  result = result.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
  
  // Wrap consecutive <li> in <ul>
  result = result.replace(/(<li>.*?<\/li>)(\s*<br>\s*)*(<li>)/g, '$1$3')
  result = result.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
  
  // Handle paragraphs - double newlines become paragraph breaks
  result = result.replace(/\n\n+/g, '</p><p>')
  
  // Single newlines become <br> only if not after block elements
  result = result.replace(/(?<!<\/div>|<\/h[1-6]>|<\/ul>|<\/li>|<\/p>)\n(?!<)/g, '<br>')
  
  // Clean up remaining newlines
  result = result.replace(/\n/g, '')
  
  // Wrap in paragraph
  result = `<p>${result}</p>`
  
  // Clean up empty paragraphs
  result = result.replace(/<p><\/p>/g, '')
  result = result.replace(/<p>\s*<br>\s*<\/p>/g, '')
  
  return result
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="chat-message-avatar">
        {isUser ? (
          <User size={20} />
        ) : (
          <Sparkles size={20} />
        )}
      </div>
      
      <div className="chat-message-content">
        {message.images && message.images.length > 0 && (
          <div className="chat-message-images">
            {message.images.map((image) => (
              <img
                key={image.id}
                src={image.data}
                alt={image.name}
                className="chat-message-image"
              />
            ))}
          </div>
        )}
        
        <div className="chat-message-text">
          {isUser ? (
            message.content.split('\n').map((line, index) => (
              <p key={index}>{line || '\u00A0'}</p>
            ))
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderContent(message.content) }} />
          )}
        </div>
      </div>
    </div>
  )
}
