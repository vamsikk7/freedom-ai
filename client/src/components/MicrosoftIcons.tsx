import React from 'react'

interface MicrosoftIconProps {
  app: 'Word' | 'Excel' | 'PowerPoint' | 'OneNote' | 'OneDrive' | 'Teams' | 'Outlook'
  size?: number
  className?: string
}

export function MicrosoftIcon({ app, size = 48, className = '' }: MicrosoftIconProps) {
  const baseClasses = `inline-block ${className}`
  
  switch (app) {
    case 'Word':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#2B579A" rx="4"/>
          <path d="M24 14L18 32L16 32L10 14H13L17.5 28.5L22 14H24Z" fill="white"/>
        </svg>
      )
    case 'Excel':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#217346" rx="4"/>
          <path d="M14 16H34V18H14V16ZM14 20H34V22H14V20ZM14 24H34V26H14V24ZM14 28H34V30H14V28Z" fill="white"/>
          <path d="M12 14H36V32H12V14Z" fill="none" stroke="white" strokeWidth="2"/>
        </svg>
      )
    case 'PowerPoint':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#ED1C24" rx="4"/>
          <circle cx="24" cy="24" r="9" fill="white"/>
          <path d="M20 20H28V22H20V20ZM20 24H28V26H20V24ZM20 28H28V30H20V28Z" fill="#ED1C24"/>
        </svg>
      )
    case 'OneNote':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#7719AA" rx="4"/>
          <path d="M16 16L24 12L32 16V32L24 36L16 32V16Z" fill="white" fillOpacity="0.95"/>
          <path d="M20 20V28L22 26L24 28L26 26L28 28V20H20Z" fill="#7719AA"/>
        </svg>
      )
    case 'OneDrive':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <path d="M24 18C20 18 17 21 17 25C17 25.5 17.1 26 17.2 26.5C15.5 27 14 28.5 14 30.5C14 33 16 35 18.5 35H29.5C31.5 35 33 33.5 33 31.5C33 29.5 31.5 28 29.5 28C29.3 28 29.1 28 28.9 28C28.5 24.5 25.5 22 22 22C21.5 22 21 22.1 20.5 22.2C20 20.5 18.5 19 16.5 19C14 19 12 21 12 23.5C12 23.8 12 24.1 12.1 24.4C10.5 25 9.5 26.5 9.5 28.5C9.5 31 11.5 33 14 33H34C36 33 37.5 31.5 37.5 29.5C37.5 27.5 36 26 34 26C33.8 26 33.6 26 33.4 26C32.8 22.5 29.8 20 26 20C25.5 20 25 20.1 24.5 20.2C24 18.5 22.5 17 20.5 17C18 17 16 19 16 21.5C16 21.8 16 22.1 16.1 22.4C14.5 23 13.5 24.5 13.5 26.5C13.5 29 15.5 31 18 31H30C32 31 33.5 29.5 33.5 27.5C33.5 25.5 32 24 30 24C29.8 24 29.6 24 29.4 24C28.8 20.5 25.8 18 22 18H24Z" fill="white" fillOpacity="0.95"/>
        </svg>
      )
    case 'Teams':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <defs>
            <linearGradient id="teamsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6264A7" />
              <stop offset="100%" stopColor="#464EB8" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#teamsGradient)" rx="4"/>
          <circle cx="18" cy="18" r="7" fill="white" fillOpacity="0.95"/>
          <path d="M11 18C11 14.5 14 11.5 17.5 11.5C21 11.5 24 14.5 24 18C24 21.5 21 24.5 17.5 24.5C14 24.5 11 21.5 11 18Z" fill="#464EB8"/>
          <rect x="25" y="19" width="16" height="14" rx="2.5" fill="white" fillOpacity="0.95"/>
          <path d="M27.5 21.5H38.5V31.5H27.5V21.5Z" fill="#464EB8"/>
        </svg>
      )
    case 'Outlook':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <rect x="12" y="14" width="24" height="20" rx="2" fill="white" fillOpacity="0.95"/>
          <path d="M14 16H34V18H14V16ZM14 20H28V22H14V20ZM14 24H28V26H14V24ZM14 28H28V30H14V28Z" fill="#0078D4"/>
          <path d="M30 22L36 28L30 34V22Z" fill="#0078D4"/>
        </svg>
      )
    default:
      return null
  }
}

