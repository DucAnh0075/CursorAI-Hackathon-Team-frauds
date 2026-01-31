import { ReactNode, useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Settings } from './Settings'
import { ChatSession } from '@/types/chat'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  sessions: ChatSession[]
  activeSessionId: string | null
  activeSessionTitle?: string
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

export function Layout({ 
  children,
  sessions,
  activeSessionId,
  activeSessionTitle,
  onSelectSession,
  onNewChat,
  onDeleteSession
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectSession={onSelectSession}
        onNewChat={onNewChat}
        onDeleteSession={onDeleteSession}
      />
      
      <div className="layout-content">
        <header className="layout-header">
          <div className="layout-header-left">
            <button 
              className="layout-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            
            {activeSessionTitle && activeSessionTitle !== 'New Chat' ? (
              <h1 className="layout-chat-title">{activeSessionTitle}</h1>
            ) : (
              <div className="layout-logo">
                <span className="layout-logo-text">AI Study Assistant</span>
              </div>
            )}
          </div>
          
          <Settings />
        </header>
        
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}
