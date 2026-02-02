import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Sun, Moon, Settings as SettingsIcon, X } from 'lucide-react'
import { useTheme } from '@hooks/useTheme'
import './Settings.css'

export function Settings() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('selectedModel') || 'langchain'
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme, setTheme } = useTheme()

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem('selectedModel', model)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="settings" ref={menuRef}>
      <button
        className="settings-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="settings-dropdown">
          <button
            className="settings-item"
            onClick={() => {
              toggleTheme()
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button
            className="settings-item"
            onClick={() => {
              setShowModal(true)
              setIsOpen(false)
            }}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </div>
      )}

      {showModal && (
        <div className="settings-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Settings</h2>
              <button
                className="settings-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="settings-modal-content">
              <div className="settings-section">
                <h3>Appearance</h3>
                <div className="settings-option">
                  <label>Theme</label>
                  <div className="settings-theme-toggle">
                    <button
                      className={`settings-theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun size={16} />
                      Light
                    </button>
                    <button
                      className={`settings-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon size={16} />
                      Dark
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>AI Model</h3>
                <div className="settings-option">
                  <label>Select Model</label>
                  <div className="settings-model-toggle">
                    <button
                      className={`settings-model-btn ${selectedModel === 'langchain' ? 'active' : ''}`}
                      onClick={() => handleModelChange('langchain')}
                    >
                      LangChain
                    </button>
                    <button
                      className={`settings-model-btn ${selectedModel === 'gemini' ? 'active' : ''}`}
                      onClick={() => handleModelChange('gemini')}
                    >
                      Gemini
                    </button>
                    <button
                      className={`settings-model-btn ${selectedModel === 'openai' ? 'active' : ''}`}
                      onClick={() => handleModelChange('openai')}
                    >
                      OpenAI
                    </button>
                    <button
                      className={`settings-model-btn ${selectedModel === 'manus' ? 'active' : ''}`}
                      onClick={() => handleModelChange('manus')}
                    >
                      Manus AI
                    </button>
                  </div>
                </div>
                <p className="settings-model-info">
                  Current: <strong>{
                    selectedModel === 'langchain' ? 'LangChain' :
                    selectedModel === 'gemini' ? 'Google Gemini' : 
                    selectedModel === 'openai' ? 'OpenAI GPT' : 
                    'Manus AI'
                  }</strong>
                </p>
              </div>

              <div className="settings-section">
                <h3>About</h3>
                <p className="settings-about">
                  AI Study Assistant v1.0.0<br />
                  Built for Hackathon 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
