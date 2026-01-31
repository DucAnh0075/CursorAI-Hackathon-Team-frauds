import { Sparkles, Image, BookOpen, Code } from 'lucide-react'
import './WelcomeScreen.css'

export function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <Sparkles size={48} />
        </div>
        
        <h1 className="welcome-title">
          How can I help you today?
        </h1>
        
        <p className="welcome-subtitle">
          I'm your AI study assistant. Ask me anything, share screenshots of problems, 
          or paste images directly.
        </p>

        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <BookOpen size={24} />
            </div>
            <div className="welcome-feature-text">
              <h3>Study Help</h3>
              <p>Get explanations for any topic</p>
            </div>
          </div>
          
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <Image size={24} />
            </div>
            <div className="welcome-feature-text">
              <h3>Screenshot Analysis</h3>
              <p>Paste or upload problem images</p>
            </div>
          </div>
          
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <Code size={24} />
            </div>
            <div className="welcome-feature-text">
              <h3>Code Assistance</h3>
              <p>Debug and explain code</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
