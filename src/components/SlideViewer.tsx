import { VideoSlide } from '../services/videoGenerator'
import './SlideViewer.css'

interface SlideViewerProps {
  slide: VideoSlide
}

export default function SlideViewer({ slide }: SlideViewerProps) {
  const renderSlide = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="slide title-slide">
            <h1 className="slide-title">{slide.content}</h1>
            <p className="slide-subtitle">Educational Explanation</p>
          </div>
        )

      case 'introduction':
        return (
          <div className="slide introduction-slide">
            <h2 className="slide-heading">Introduction</h2>
            <p className="slide-content">{slide.content}</p>
          </div>
        )

      case 'step':
        return (
          <div className="slide step-slide">
            <div className="step-badge">Step {slide.stepNumber}</div>
            <h2 className="slide-heading">Step {slide.stepNumber}</h2>
            <p className="slide-content">{slide.content}</p>
          </div>
        )

      case 'key-points':
        return (
          <div className="slide key-points-slide">
            <h2 className="slide-heading">Key Points</h2>
            <ul className="key-points-list">
              {slide.keyPoints?.map((point, index) => (
                <li key={index} className="key-point-item">
                  <span className="bullet">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )

      case 'conclusion':
        return (
          <div className="slide conclusion-slide">
            <h2 className="slide-heading">Conclusion</h2>
            <p className="slide-content">{slide.content}</p>
          </div>
        )

      default:
        return <div className="slide">Unknown slide type</div>
    }
  }

  return <div className="slide-viewer">{renderSlide()}</div>
}
