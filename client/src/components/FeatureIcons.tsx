import React from 'react'

interface FeatureIconProps {
  icon: 'analytics' | 'billing' | 'security' | 'insights' | 'auto' | 'project' | 'tenant' | 'stripe' | 'limits' | 'report' | 'users' | 'patterns' | 'api'
  size?: number
  className?: string
}

export function FeatureIcon({ icon, size = 64, className = '' }: FeatureIconProps) {
  const baseClasses = `inline-block ${className}`
  
  switch (icon) {
    case 'analytics':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <path d="M12 32L16 24L20 28L24 18L28 26L32 22V34H12V32Z" fill="white"/>
          <path d="M12 36H36V38H12V36Z" fill="white" fillOpacity="0.7"/>
        </svg>
      )
    case 'billing':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#107C10" rx="4"/>
          <circle cx="24" cy="24" r="10" fill="white"/>
          <path d="M20 24L22.5 26.5L28 21" stroke="#107C10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'security':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <path d="M24 14L16 18V24C16 30 20 35 24 36C28 35 32 30 32 24V18L24 14Z" fill="white"/>
          <path d="M22 26L20 24L18 26L22 30L30 22L28 20L22 26Z" fill="#0078D4"/>
        </svg>
      )
    case 'insights':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <path d="M14 32L18 22L22 28L26 16L30 24L34 20V34H14V32Z" fill="white"/>
          <circle cx="18" cy="22" r="2" fill="#0078D4"/>
          <circle cx="22" cy="28" r="2" fill="#0078D4"/>
          <circle cx="26" cy="16" r="2" fill="#0078D4"/>
          <circle cx="30" cy="24" r="2" fill="#0078D4"/>
          <circle cx="34" cy="20" r="2" fill="#0078D4"/>
        </svg>
      )
    case 'auto':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#FFB900" rx="4"/>
          <path d="M24 14L18 26H22V34H26V26H30L24 14Z" fill="white"/>
        </svg>
      )
    case 'project':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <circle cx="24" cy="24" r="8" fill="white"/>
          <circle cx="24" cy="24" r="4" fill="#0078D4"/>
        </svg>
      )
    case 'tenant':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <rect x="12" y="14" width="10" height="20" rx="2" fill="white"/>
          <rect x="26" y="18" width="10" height="16" rx="2" fill="white" fillOpacity="0.8"/>
        </svg>
      )
    case 'stripe':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#635BFF" rx="4"/>
          <rect x="14" y="18" width="20" height="12" rx="2" fill="white"/>
          <path d="M18 22H30V24H18V22ZM18 26H26V28H18V26Z" fill="#635BFF"/>
        </svg>
      )
    case 'limits':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <rect x="14" y="16" width="20" height="16" rx="2" fill="white"/>
          <path d="M18 20H30V22H18V20ZM18 24H28V26H18V24ZM18 28H26V30H18V28Z" fill="#0078D4"/>
        </svg>
      )
    case 'report':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <rect x="14" y="14" width="20" height="20" rx="2" fill="white"/>
          <path d="M18 18H30V20H18V18ZM18 22H30V24H18V22ZM18 26H26V28H18V26Z" fill="#0078D4"/>
        </svg>
      )
    case 'users':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <circle cx="20" cy="18" r="5" fill="white"/>
          <circle cx="28" cy="20" r="4" fill="white" fillOpacity="0.8"/>
          <path d="M14 30C14 26 16.5 24 20 24C23.5 24 26 26 26 30V32H14V30Z" fill="white"/>
          <path d="M26 28C26 26.5 27 25.5 28 25.5C29 25.5 30 26.5 30 28V30H26V28Z" fill="white" fillOpacity="0.8"/>
        </svg>
      )
    case 'patterns':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <circle cx="16" cy="20" r="3" fill="white"/>
          <circle cx="24" cy="16" r="3" fill="white"/>
          <circle cx="32" cy="24" r="3" fill="white"/>
          <path d="M16 20L24 16L32 24" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M12 32L20 28L28 36L36 30" stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      )
    case 'api':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" className={baseClasses}>
          <rect width="48" height="48" fill="#0078D4" rx="4"/>
          <rect x="14" y="18" width="20" height="12" rx="2" fill="white"/>
          <path d="M18 22H30V24H18V22ZM18 26H28V28H18V26Z" fill="#0078D4"/>
          <circle cx="16" cy="20" r="1.5" fill="#0078D4"/>
          <circle cx="32" cy="28" r="1.5" fill="#0078D4"/>
        </svg>
      )
    default:
      return null
  }
}

