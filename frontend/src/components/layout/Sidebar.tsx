import { MessageSquare, Plus, Trash2, X } from 'lucide-react'
import { ChatSession } from '@/types/chat'
import './Sidebar.css'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  isOpen: boolean
  onClose: () => void
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

export function Sidebar({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  onDeleteSession
}: SidebarProps) {

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const handleSelectSession = (id: string) => {
    onSelectSession(id)
    onClose()
  }

  const handleNewChat = () => {
    onNewChat()
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button 
            className="sidebar-new-chat"
            onClick={handleNewChat}
            title="New Chat"
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
          
          <button
            className="sidebar-close"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-sessions">
          {sessions.length === 0 ? (
            <div className="sidebar-empty">
              <p>No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`sidebar-session ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageSquare size={18} className="sidebar-session-icon" />
                <div className="sidebar-session-content">
                  <span className="sidebar-session-title">{session.title}</span>
                  <span className="sidebar-session-date">
                    {formatDate(session.updatedAt)}
                  </span>
                </div>
                <button
                  className="sidebar-session-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
