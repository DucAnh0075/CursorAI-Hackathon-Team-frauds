import { useState } from 'react'
import FileUpload from './components/FileUpload'
import VideoGenerator from './components/VideoGenerator'
import './App.css'

function App() {
  const [inputText, setInputText] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setInputText('')
  }

  const handleTextInput = (text: string) => {
    setInputText(text)
    setUploadedFile(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 AI Study Video Generator</h1>
        <p>Transform exercises into educational videos</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <FileUpload
            onFileUpload={handleFileUpload}
            onTextInput={handleTextInput}
            disabled={isGenerating}
          />
        </div>

        {(inputText || uploadedFile) && (
          <div className="generator-section">
            <VideoGenerator
              inputText={inputText}
              uploadedFile={uploadedFile}
              onGeneratingChange={setIsGenerating}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built for Hackathon 2024</p>
      </footer>
    </div>
  )
}

export default App
