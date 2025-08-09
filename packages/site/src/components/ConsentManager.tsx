/**
 * GDPR/CCPA Compliant Consent Manager
 * Privacy-first consent management with granular controls
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type {
  ConsentPreferences,
  ConsentCategory,
  ConsentBanner,
  GDPRCompliance,
  CCPACompliance
} from '../interfaces/AnalyticsSystem'

interface ConsentManagerProps {
  onConsentUpdate: (consent: ConsentPreferences) => void
  gdprCompliance?: GDPRCompliance
  ccpaCompliance?: CCPACompliance
  banner?: Partial<ConsentBanner>
  categories?: ConsentCategory[]
  className?: string
}

const DEFAULT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Essential cookies required for the website to function properly.',
    required: true,
    enabled: true,
    cookies: [
      {
        name: 'theme-preference',
        provider: 'Site',
        purpose: 'Remember your theme preference',
        expiry: '1 year',
        type: 'functional'
      }
    ],
    purposes: ['Website functionality', 'User preferences'],
    retention: '1 year',
    dataTypes: ['Preferences']
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our website by collecting anonymous information.',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'umami-analytics',
        provider: 'Umami',
        purpose: 'Anonymous usage analytics',
        expiry: 'Session',
        type: 'analytics'
      }
    ],
    purposes: ['Website improvement', 'Usage analytics'],
    retention: '1 year',
    dataTypes: ['Page views', 'User interactions', 'Device information']
  },
  {
    id: 'performance',
    name: 'Performance Cookies',
    description: 'Monitor website performance and optimize user experience.',
    required: false,
    enabled: false,
    cookies: [
      {
        name: 'performance-metrics',
        provider: 'Site',
        purpose: 'Performance monitoring',
        expiry: 'Session',
        type: 'performance'
      }
    ],
    purposes: ['Performance monitoring', 'Error tracking'],
    retention: '30 days',
    dataTypes: ['Performance metrics', 'Error logs']
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Currently not used on this website.',
    required: false,
    enabled: false,
    cookies: [],
    purposes: ['Not applicable'],
    retention: 'Not applicable',
    dataTypes: ['Not applicable']
  }
]

const DEFAULT_BANNER: ConsentBanner = {
  show: true,
  position: 'bottom',
  style: 'detailed',
  language: 'en',
  customText: {
    title: 'Privacy & Cookies',
    description: 'We use cookies to enhance your browsing experience and analyze our traffic. All data is anonymized and no personal information is collected.',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    customize: 'Customize',
    save: 'Save Preferences'
  }
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  onConsentUpdate,
  gdprCompliance,
  ccpaCompliance,
  banner = {},
  categories = DEFAULT_CATEGORIES,
  className = ''
}) => {
  const { theme } = useTheme()
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<ConsentPreferences | null>(null)
  const [categorySettings, setCategorySettings] = useState<ConsentCategory[]>(categories)

  const bannerConfig = { ...DEFAULT_BANNER, ...banner }

  // Load saved consent on mount
  useEffect(() => {
    loadSavedConsent()
  }, [])

  const loadSavedConsent = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('consent-preferences')
      if (saved) {
        const preferences: ConsentPreferences = JSON.parse(saved)
        
        // Check if consent is still valid (not older than 1 year)
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000)
        if (preferences.timestamp > oneYearAgo) {
          setConsent(preferences)
          updateCategorySettings(preferences)
          return
        }
      }
      
      // No valid consent found, show banner
      setShowBanner(true)
    } catch (error) {
      console.warn('Failed to load saved consent:', error)
      setShowBanner(true)
    }
  }, [])

  const updateCategorySettings = useCallback((preferences: ConsentPreferences) => {
    setCategorySettings(prevCategories =>
      prevCategories.map(category => ({
        ...category,
        enabled: preferences[category.id as keyof ConsentPreferences] as boolean || category.required
      }))
    )
  }, [])

  const saveConsent = useCallback((preferences: ConsentPreferences) => {
    if (typeof window === 'undefined') return

    const consentData: ConsentPreferences = {
      ...preferences,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    try {
      localStorage.setItem('consent-preferences', JSON.stringify(consentData))
      setConsent(consentData)
      updateCategorySettings(consentData)
      onConsentUpdate(consentData)
    } catch (error) {
      console.error('Failed to save consent preferences:', error)
    }
  }, [onConsentUpdate, updateCategorySettings])

  const handleAcceptAll = useCallback(() => {
    const preferences: ConsentPreferences = {
      analytics: true,
      performance: true,
      marketing: false,
      functional: true,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    saveConsent(preferences)
    setShowBanner(false)
    setShowDetails(false)
  }, [saveConsent])

  const handleRejectAll = useCallback(() => {
    const preferences: ConsentPreferences = {
      analytics: false,
      performance: false,
      marketing: false,
      functional: true, // Always required
      timestamp: Date.now(),
      version: '1.0.0'
    }

    saveConsent(preferences)
    setShowBanner(false)
    setShowDetails(false)
  }, [saveConsent])

  const handleSaveCustom = useCallback(() => {
    const preferences: ConsentPreferences = {
      analytics: categorySettings.find(c => c.id === 'analytics')?.enabled || false,
      performance: categorySettings.find(c => c.id === 'performance')?.enabled || false,
      marketing: categorySettings.find(c => c.id === 'marketing')?.enabled || false,
      functional: true, // Always required
      timestamp: Date.now(),
      version: '1.0.0'
    }

    saveConsent(preferences)
    setShowBanner(false)
    setShowDetails(false)
  }, [categorySettings, saveConsent])

  const handleCategoryToggle = useCallback((categoryId: string, enabled: boolean) => {
    setCategorySettings(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, enabled: category.required || enabled }
          : category
      )
    )
  }, [])

  const showConsentManager = useCallback(() => {
    setShowBanner(true)
    setShowDetails(true)
  }, [])

  // Don't render anything if consent is already given and banner shouldn't show
  if (!showBanner && consent) {
    return (
      <button
        onClick={showConsentManager}
        className={`fixed bottom-4 right-4 z-50 px-3 py-2 text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${className}`}
        aria-label="Manage cookie preferences"
      >
        🍪 Privacy
      </button>
    )
  }

  if (!showBanner) {
    return null
  }

  const bannerClasses = `
    fixed z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg
    ${bannerConfig.position === 'top' ? 'top-0' : 'bottom-0'} 
    left-0 right-0 p-4
    ${className}
  `

  return (
    <div className={bannerClasses} role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
      {!showDetails ? (
        // Simple banner
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 id="consent-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {bannerConfig.customText?.title}
              </h3>
              <p id="consent-description" className="text-sm text-gray-600 dark:text-gray-400">
                {bannerConfig.customText?.description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {bannerConfig.customText?.rejectAll}
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                {bannerConfig.customText?.customize}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {bannerConfig.customText?.acceptAll}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Detailed consent manager
        <div className="max-w-4xl mx-auto max-h-96 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Privacy Preferences
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose which cookies you want to accept. You can change these settings at any time.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {categorySettings.map((category) => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={`consent-${category.id}`} className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                    {category.required && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Required)</span>
                    )}
                  </label>
                  <input
                    id={`consent-${category.id}`}
                    type="checkbox"
                    checked={category.enabled}
                    disabled={category.required}
                    onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {category.description}
                </p>
                <details className="text-xs text-gray-500 dark:text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Show details
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p><strong>Purposes:</strong> {category.purposes.join(', ')}</p>
                    <p><strong>Data retention:</strong> {category.retention}</p>
                    <p><strong>Data types:</strong> {category.dataTypes.join(', ')}</p>
                    {category.cookies.length > 0 && (
                      <div>
                        <strong>Cookies:</strong>
                        <ul className="ml-4 mt-1">
                          {category.cookies.map((cookie, index) => (
                            <li key={index}>
                              {cookie.name} - {cookie.purpose} ({cookie.expiry})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* GDPR/CCPA Information */}
          {(gdprCompliance || ccpaCompliance) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <details className="text-xs text-gray-500 dark:text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                  Your Rights & Legal Information
                </summary>
                {gdprCompliance && (
                  <div className="mb-3">
                    <h4 className="font-semibold mb-1">GDPR Rights</h4>
                    <p className="mb-1">Data Controller: {gdprCompliance.dataController.name}</p>
                    <p className="mb-1">Contact: {gdprCompliance.dataController.email}</p>
                    <p className="mb-1">Legal Basis: {gdprCompliance.lawfulBasis}</p>
                    <p>You have the right to access, rectify, erase, restrict processing, and data portability.</p>
                  </div>
                )}
                {ccpaCompliance && (
                  <div>
                    <h4 className="font-semibold mb-1">CCPA Rights</h4>
                    <p className="mb-1">California residents have the right to know, delete, and opt-out.</p>
                    <p>We do not sell personal information.</p>
                  </div>
                )}
              </details>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowDetails(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {bannerConfig.customText?.rejectAll}
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {bannerConfig.customText?.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsentManager