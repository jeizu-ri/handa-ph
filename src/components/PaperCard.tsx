import type { ReactNode } from 'react'

interface PaperCardProps {
  children: ReactNode
  className?: string
  pin?: boolean
  tilt?: 'left' | 'right' | 'none'
}

export function PaperCard({ children, className = '', pin = false, tilt = 'none' }: PaperCardProps) {
  const tiltClass =
    tilt === 'left' ? 'paper-card--tilt-left' : tilt === 'right' ? 'paper-card--tilt-right' : ''
  return (
    <div className={`relative paper-card ${tiltClass} ${className}`}>
      {pin && <span className="pushpin" aria-hidden="true" />}
      {children}
    </div>
  )
}
