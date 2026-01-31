import { Layout } from '@components/layout/Layout'
import { ChatContainer } from '@components/chat/ChatContainer'
import { ThemeProvider } from '@hooks/useTheme'
import { useChatSessions } from '@hooks/useChatSessions'

function AppContent() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    addMessage,
    deleteSession,
    getActiveSession
  } = useChatSessions()

  const activeSession = getActiveSession()

  const handleNewChat = () => {
    createSession()
  }

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id)
  }

  const handleDeleteSession = (id: string) => {
    deleteSession(id)
  }

  return (
    <Layout
      sessions={sessions}
      activeSessionId={activeSessionId}
      activeSessionTitle={activeSession?.title}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onDeleteSession={handleDeleteSession}
    >
      <ChatContainer
        session={activeSession}
        onNewSession={createSession}
        onAddMessage={(message) => {
          if (activeSessionId) {
            addMessage(activeSessionId, message)
          }
        }}
      />
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
