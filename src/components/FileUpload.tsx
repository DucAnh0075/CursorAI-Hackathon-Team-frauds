import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  onTextInput: (text: string) => void
  disabled?: boolean
}

export default function FileUpload({ onFileUpload, onTextInput, disabled }: FileUploadProps) {
  const [textInput, setTextInput] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFileName(file.name)
      onFileUpload(file)
      setTextInput('')
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    disabled,
    multiple: false
  })

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextInput(textInput.trim())
      setUploadedFileName(null)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
  }

  return (
    <div className="file-upload-container">
      <h2>Input Your Exercise</h2>
      
      <div className="input-tabs">
        <div className="tab-content">
          {/* Text Input */}
          <div className="text-input-section">
            <label htmlFor="text-input">Or type your question directly:</label>
            <textarea
              id="text-input"
              value={textInput}
              onChange={handleTextChange}
              placeholder="Enter your exercise or question here...&#10;&#10;Example: Solve the quadratic equation x² + 5x + 6 = 0"
              rows={6}
              disabled={disabled}
              className="text-input"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || disabled}
              className="submit-button"
            >
              Generate Video
            </button>
          </div>

          {/* File Upload */}
          <div className="divider">
            <span>OR</span>
          </div>

          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <svg
                className="upload-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="dropzone-text">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a PDF or image here, or click to select'}
              </p>
              <p className="dropzone-hint">Supports PDF, PNG, JPG</p>
              {uploadedFileName && (
                <p className="uploaded-file">✓ {uploadedFileName}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
