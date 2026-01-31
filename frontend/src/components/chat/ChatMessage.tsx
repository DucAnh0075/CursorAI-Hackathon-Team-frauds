import { Message } from '@/types/chat'
import { User, Sparkles } from 'lucide-react'
import './ChatMessage.css'

interface ChatMessageProps {
  message: Message
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
          {message.content.split('\n').map((line, index) => (
            <p key={index}>{line || '\u00A0'}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
