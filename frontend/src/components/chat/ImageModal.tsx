import { X } from 'lucide-react'
import { useEffect } from 'react'
import './ImageModal.css'

interface ImageModalProps {
  imageUrl: string
  imageName: string
  onClose: () => void
}

export function ImageModal({ imageUrl, imageName, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <img src={imageUrl} alt={imageName} className="image-modal-image" />
        <div className="image-modal-caption">{imageName}</div>
      </div>
    </div>
  )
}
