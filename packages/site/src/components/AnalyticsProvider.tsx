/**
 * Analytics Provider Component
 * Root provider that integrates all analytics functionality with the app
 */

import React, { ReactNode } from 'react'
import { AnalyticsProvider } from '../contexts/AnalyticsContext'
import ConsentManager from './ConsentManager'
import { useBackgroundAnalytics } from '../hooks/useBackgroundAnalytics'
import { useEasterEggAnalytics } from '../hooks/useEasterEggAnalytics'
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics'
import type {
  AnalyticsConfig,
  UmamiConfig,
  LocalAnalytics,
  GDPRCompliance,
  CCPACompliance
} from '../interfaces/AnalyticsSystem'

interface AnalyticsRootProviderProps {
  children: ReactNode
  config?: {
    analytics?: Partial<AnalyticsConfig>
    umami?: Partial<UmamiConfig>
    local?: Partial<LocalAnalytics>
    gdpr?: GDPRCompliance
    ccpa?: CCPACompliance
  }
  showConsentBanner?: boolean
  className?: string
}

// Default configurations
const DEFAULT_GDPR: GDPRCompliance = {
  lawfulBasis: 'consent',
  dataController: {
    name: 'Personal Website',
    contact: 'Site Owner',
    address: 'As specified in contact information',
    email: 'Contact via site form'
  },
  dataRetention: {
    period: 365,
    purgeSchedule: '0 0 * * 0', // Weekly
    anonymization: true
  },
  userRights: {
    access: true,
    rectification: true,
    erasure: true,
    portability: true,
    restriction: true,
    objection: true
  }
}

const DEFAULT_CCPA: CCPACompliance = {
  businessPurpose: [
    'Website analytics',
    'Performance monitoring',
    'User experience improvement'
  ],
  commercialPurpose: [],
  thirdPartySharing: false,
  saleOfData: false,
  optOutEnabled: true,
  categories: {
    personalInfo: [],
    sensitiveInfo: [],
    commercialInfo: [],
    biometricInfo: [],
    internetActivity: [
      'Page views',
      'Background module interactions',
      'Easter egg discoveries'
    ],
    geolocationData: [],
    audioVisual: [],
    professionalInfo: [],
    educationInfo: [],
    inferences: [
      'Usage patterns',
      'Performance preferences'
    ]
  }
}

/**
 * Inner component that uses analytics hooks after provider is initialized
 */
const AnalyticsIntegration: React.FC = () => {
  // Initialize analytics hooks for automatic tracking
  useBackgroundAnalytics({
    trackModuleActivation: true,
    trackModuleDeactivation: true,
    trackConfigurationChanges: true,
    trackPerformanceIssues: true,
    trackQualityAdjustments: true,
    trackUserInteractions: true
  })

  useEasterEggAnalytics({
    trackDiscoveries: true,
    trackProgress: true,
    trackHints: true,
    trackFailedAttempts: true,
    trackSharing: true,
    aggregateOnly: true
  })

  usePerformanceAnalytics({
    trackFrameDrops: true,
    trackMemorySpikes: true,
    trackQualityAdjustments: true,
    trackDeviceCorrelation: true,
    trackBatteryImpact: true,
    trackThermalThrottling: true,
    enablePredictiveAnalysis: true
  })

  return null // This component only provides hooks
}

export const AnalyticsRootProvider: React.FC<AnalyticsRootProviderProps> = ({
  children,
  config = {},
  showConsentBanner = true,
  className = ''
}) => {
  const analyticsConfig: Partial<AnalyticsConfig> = {
    websiteId: process.env.GATSBY_UMAMI_WEBSITE_ID || '',
    scriptUrl: process.env.GATSBY_UMAMI_SCRIPT_URL || 'https://analytics.umami.is/script.js',
    trackPageViews: true,
    trackEvents: true,
    respectDoNotTrack: true,
    cookieless: true,
    sessionTimeout: 30 * 60 * 1000,
    dataRetention: 365,
    anonymizeIp: true,
    enabled: !!process.env.GATSBY_UMAMI_WEBSITE_ID,
    ...config.analytics
  }

  const umamiConfig: Partial<UmamiConfig> = {
    websiteId: process.env.GATSBY_UMAMI_WEBSITE_ID || '',
    scriptUrl: process.env.GATSBY_UMAMI_SCRIPT_URL || 'https://analytics.umami.is/script.js',
    trackLocalhost: process.env.NODE_ENV === 'development',
    autoTrack: false,
    ...config.umami
  }

  const localConfig: Partial<LocalAnalytics> = {
    enabled: true,
    storageQuota: 5,
    syncInterval: 5,
    batchSize: 50,
    compression: true,
    encryption: false,
    offlineSupport: true,
    purgeOldData: true,
    purgeThreshold: 7,
    ...config.local
  }

  const gdprConfig: GDPRCompliance = {
    ...DEFAULT_GDPR,
    ...config.gdpr
  }

  const ccpaConfig: CCPACompliance = {
    ...DEFAULT_CCPA,
    ...config.ccpa
  }

  return (
    <div className={className}>
      <AnalyticsProvider
        config={analyticsConfig}
        umamiConfig={umamiConfig}
        localConfig={localConfig}
        gdprCompliance={gdprConfig}
        ccpaCompliance={ccpaConfig}
      >
        {/* Initialize analytics hooks */}
        <AnalyticsIntegration />
        
        {/* Consent management */}
        {showConsentBanner && (
          <ConsentManager
            onConsentUpdate={(consent) => {
              // Consent update is handled automatically by AnalyticsProvider
              console.log('Consent updated:', consent)
            }}
            gdprCompliance={gdprConfig}
            ccpaCompliance={ccpaConfig}
          />
        )}
        
        {/* App content */}
        {children}
      </AnalyticsProvider>
    </div>
  )
}

export default AnalyticsRootProvider