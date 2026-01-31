import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, ArrowRight, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './StepByStep.css'

interface Step {
  step_number: number
  title: string
  explanation: string
  math_content: string
  visual_description: string
  key_insight: string
  generated_image?: string | null
}

interface ExplanationData {
  problem_summary: string
  notation_used: string[]
  steps: Step[]
  final_answer: string
  red_thread: string
}

interface StepByStepProps {
  data: ExplanationData
  isLoading?: boolean
}

// Render math content with KaTeX
function renderMath(content: string): string {
  let result = content
  
  // Convert \[ \] to display math
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
    } catch {
      return math
    }
  })
  
  // Convert \( \) to inline math
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return math
    }
  })
  
  return result
}

function StepCard({ step, isExpanded, onToggle }: { step: Step; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className={`step-card ${isExpanded ? 'step-card-expanded' : ''}`}>
      <div className="step-header" onClick={onToggle}>
        <div className="step-number">
          <span>{step.step_number}</span>
        </div>
        <div className="step-title-area">
          <h3 className="step-title">{step.title}</h3>
          {step.key_insight && (
            <div className="step-insight-preview">
              <Lightbulb size={14} />
              <span>{step.key_insight.substring(0, 50)}...</span>
            </div>
          )}
        </div>
        <button className="step-toggle">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="step-content">
          <div className="step-explanation">
            <h4>Erklärung</h4>
            <p>{step.explanation}</p>
          </div>
          
          {step.math_content && (
            <div className="step-math">
              <h4>Mathematik</h4>
              <div 
                className="math-content"
                dangerouslySetInnerHTML={{ __html: renderMath(step.math_content) }}
              />
            </div>
          )}
          
          {step.generated_image && (
            <div className="step-image">
              <h4><ImageIcon size={16} /> Visualisierung</h4>
              <img src={step.generated_image} alt={`Schritt ${step.step_number} Visualisierung`} />
            </div>
          )}
          
          {step.key_insight && (
            <div className="step-key-insight">
              <Lightbulb size={18} />
              <div>
                <strong>Wichtige Erkenntnis:</strong>
                <p>{step.key_insight}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function StepByStep({ data, isLoading }: StepByStepProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]))
  const [showAllSteps, setShowAllSteps] = useState(false)
  
  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber)
      } else {
        newSet.add(stepNumber)
      }
      return newSet
    })
  }
  
  const expandAll = () => {
    if (showAllSteps) {
      setExpandedSteps(new Set([1]))
    } else {
      setExpandedSteps(new Set(data.steps.map(s => s.step_number)))
    }
    setShowAllSteps(!showAllSteps)
  }
  
  if (isLoading) {
    return (
      <div className="step-by-step-loading">
        <Loader2 className="spin" size={32} />
        <p>Analysiere Problem und erstelle Lösungsschritte...</p>
      </div>
    )
  }
  
  return (
    <div className="step-by-step-container">
      {/* Problem Summary */}
      <div className="problem-summary">
        <h2>📋 Problemübersicht</h2>
        <p>{data.problem_summary}</p>
        {data.notation_used.length > 0 && (
          <div className="notation-tags">
            <span className="notation-label">Verwendete Notation:</span>
            {data.notation_used.map((notation, i) => (
              <span key={i} className="notation-tag">{notation}</span>
            ))}
          </div>
        )}
      </div>
      
      {/* Red Thread */}
      {data.red_thread && (
        <div className="red-thread">
          <h3>🧵 Der Rote Faden</h3>
          <p>{data.red_thread}</p>
        </div>
      )}
      
      {/* Steps Header */}
      <div className="steps-header">
        <h2>📝 Lösungsschritte</h2>
        <button className="expand-all-btn" onClick={expandAll}>
          {showAllSteps ? 'Alle einklappen' : 'Alle aufklappen'}
        </button>
      </div>
      
      {/* Step Cards */}
      <div className="steps-container">
        {data.steps.map((step, index) => (
          <div key={step.step_number} className="step-wrapper">
            <StepCard
              step={step}
              isExpanded={expandedSteps.has(step.step_number)}
              onToggle={() => toggleStep(step.step_number)}
            />
            {index < data.steps.length - 1 && (
              <div className="step-connector">
                <ArrowRight size={20} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Final Answer */}
      {data.final_answer && (
        <div className="final-answer">
          <CheckCircle size={24} />
          <div>
            <h3>Endergebnis</h3>
            <div 
              className="answer-content"
              dangerouslySetInnerHTML={{ __html: renderMath(data.final_answer) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
