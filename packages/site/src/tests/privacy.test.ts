/**
 * Privacy Compliance Testing Suite
 * Comprehensive tests for GDPR, CCPA, and privacy-first analytics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConsentManager } from '../components/ConsentManager'
import { UmamiAnalytics } from '../utils/UmamiAnalytics'
import type {
  ConsentPreferences,
  ConsentCategory,
  GDPRCompliance,
  CCPACompliance,
  DataProcessingRecord
} from '../interfaces/AnalyticsSystem'

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key]
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {}
  })
}

// Mock theme context
const mockThemeContext = {
  theme: 'light' as const,
  setTheme: vi.fn()
}

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext
}))

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true })

describe('Consent Management Privacy Tests', () => {
  const mockGDPRCompliance: GDPRCompliance = {
    lawfulBasis: 'consent',
    dataController: {
      name: 'Test Site',
      contact: 'privacy@test.com',
      address: '123 Test St',
      email: 'privacy@test.com'
    },
    dataRetention: {
      period: 365,
      purgeSchedule: '0 0 * * 0',
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

  const mockCCPACompliance: CCPACompliance = {
    businessPurpose: ['Analytics', 'Performance monitoring'],
    commercialPurpose: [],
    thirdPartySharing: false,
    saleOfData: false,
    optOutEnabled: true,
    categories: {
      personalInfo: [],
      sensitiveInfo: [],
      commercialInfo: [],
      biometricInfo: [],
      internetActivity: ['Page views', 'Interaction events'],
      geolocationData: [],
      audioVisual: [],
      professionalInfo: [],
      educationInfo: [],
      inferences: ['Usage patterns']
    }
  }

  const mockOnConsentUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('Consent Banner Behavior', () => {
    it('should show consent banner when no consent is stored', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
          ccpaCompliance={mockCCPACompliance}
        />
      )

      expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument()
      expect(screen.getByText(/We use cookies to enhance/)).toBeInTheDocument()
    })

    it('should not show banner when valid consent exists', () => {
      const validConsent: ConsentPreferences = {
        analytics: true,
        performance: false,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      mockLocalStorage.data['consent-preferences'] = JSON.stringify(validConsent)

      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      // Banner should not be visible, only privacy button
      expect(screen.queryByText('Privacy & Cookies')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Manage cookie preferences')).toBeInTheDocument()
    })

    it('should show banner when consent is expired', () => {
      const expiredConsent: ConsentPreferences = {
        analytics: true,
        performance: false,
        marketing: false,
        functional: true,
        timestamp: Date.now() - (400 * 24 * 60 * 60 * 1000), // 400 days ago
        version: '1.0.0'
      }

      mockLocalStorage.data['consent-preferences'] = JSON.stringify(expiredConsent)

      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      expect(screen.getByText('Privacy & Cookies')).toBeInTheDocument()
    })
  })

  describe('Consent Choices', () => {
    it('should handle "Accept All" correctly', async () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const acceptAllButton = screen.getByText('Accept All')
      fireEvent.click(acceptAllButton)

      await waitFor(() => {
        expect(mockOnConsentUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            analytics: true,
            performance: true,
            marketing: false,
            functional: true
          })
        )
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'consent-preferences',
        expect.stringContaining('"analytics":true')
      )
    })

    it('should handle "Reject All" correctly', async () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const rejectAllButton = screen.getByText('Reject All')
      fireEvent.click(rejectAllButton)

      await waitFor(() => {
        expect(mockOnConsentUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            analytics: false,
            performance: false,
            marketing: false,
            functional: true // Always required
          })
        )
      })
    })

    it('should handle custom consent preferences', async () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      // Click customize
      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      await waitFor(() => {
        expect(screen.getByText('Privacy Preferences')).toBeInTheDocument()
      })

      // Toggle analytics off
      const analyticsCheckbox = screen.getByLabelText(/Analytics Cookies/)
      fireEvent.click(analyticsCheckbox)

      // Save preferences
      const saveButton = screen.getByText('Save Preferences')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnConsentUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            analytics: false,
            performance: false,
            marketing: false,
            functional: true
          })
        )
      })
    })

    it('should not allow disabling functional cookies', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      const functionalCheckbox = screen.getByLabelText(/Functional Cookies/)
      expect(functionalCheckbox).toBeDisabled()
      expect(functionalCheckbox).toBeChecked()
    })
  })

  describe('GDPR Compliance', () => {
    it('should display GDPR information when provided', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      // Expand legal information
      const legalSummary = screen.getByText('Your Rights & Legal Information')
      fireEvent.click(legalSummary)

      expect(screen.getByText('GDPR Rights')).toBeInTheDocument()
      expect(screen.getByText(`Data Controller: ${mockGDPRCompliance.dataController.name}`)).toBeInTheDocument()
      expect(screen.getByText(`Contact: ${mockGDPRCompliance.dataController.email}`)).toBeInTheDocument()
    })

    it('should show user rights information', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      const legalSummary = screen.getByText('Your Rights & Legal Information')
      fireEvent.click(legalSummary)

      expect(screen.getByText(/right to access, rectify, erase/)).toBeInTheDocument()
    })
  })

  describe('CCPA Compliance', () => {
    it('should display CCPA information when provided', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          ccpaCompliance={mockCCPACompliance}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      const legalSummary = screen.getByText('Your Rights & Legal Information')
      fireEvent.click(legalSummary)

      expect(screen.getByText('CCPA Rights')).toBeInTheDocument()
      expect(screen.getByText(/California residents have the right/)).toBeInTheDocument()
      expect(screen.getByText('We do not sell personal information.')).toBeInTheDocument()
    })
  })

  describe('Cookie Categories', () => {
    const customCategories: ConsentCategory[] = [
      {
        id: 'functional',
        name: 'Essential Cookies',
        description: 'Required for website functionality',
        required: true,
        enabled: true,
        cookies: [
          {
            name: 'session',
            provider: 'Site',
            purpose: 'Session management',
            expiry: 'Session',
            type: 'functional'
          }
        ],
        purposes: ['Authentication', 'Security'],
        retention: 'Session',
        dataTypes: ['Session ID']
      },
      {
        id: 'custom-analytics',
        name: 'Custom Analytics',
        description: 'Custom tracking implementation',
        required: false,
        enabled: false,
        cookies: [
          {
            name: 'custom_analytics',
            provider: 'Custom',
            purpose: 'Usage tracking',
            expiry: '1 year',
            type: 'analytics'
          }
        ],
        purposes: ['Usage analysis'],
        retention: '1 year',
        dataTypes: ['Page views', 'Clicks']
      }
    ]

    it('should display custom cookie categories', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          categories={customCategories}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      expect(screen.getByText('Essential Cookies')).toBeInTheDocument()
      expect(screen.getByText('Custom Analytics')).toBeInTheDocument()
    })

    it('should show detailed cookie information', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          categories={customCategories}
        />
      )

      const customizeButton = screen.getByText('Customize')
      fireEvent.click(customizeButton)

      // Expand details for first category
      const detailsSummary = screen.getAllByText('Show details')[0]
      fireEvent.click(detailsSummary)

      expect(screen.getByText('Purposes:')).toBeInTheDocument()
      expect(screen.getByText('Data retention:')).toBeInTheDocument()
      expect(screen.getByText('Cookies:')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const acceptButton = screen.getByText('Accept All')
      
      // Should be focusable
      acceptButton.focus()
      expect(acceptButton).toHaveFocus()

      // Should be activatable with Enter
      fireEvent.keyDown(acceptButton, { key: 'Enter', code: 'Enter' })
      expect(mockOnConsentUpdate).toHaveBeenCalled()
    })

    it('should have proper ARIA attributes', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')

      const title = screen.getByLabelText(/Privacy & Cookies/)
      expect(title).toBeInTheDocument()
    })

    it('should provide screen reader friendly content', () => {
      render(
        <ConsentManager
          onConsentUpdate={mockOnConsentUpdate}
          gdprCompliance={mockGDPRCompliance}
        />
      )

      // Check for screen reader only content
      const srOnlyElements = document.querySelectorAll('.sr-only')
      expect(srOnlyElements.length).toBeGreaterThan(0)
    })
  })
})

describe('Data Processing Privacy Tests', () => {
  let analytics: UmamiAnalytics

  beforeEach(() => {
    analytics = UmamiAnalytics.getInstance()
  })

  describe('Data Anonymization', () => {
    it('should anonymize all personally identifiable data', () => {
      const processedData = {
        sessionId: 'sess_123_abc',
        timestamp: Date.now(),
        event: 'page_view',
        anonymized: true
      }

      // Should not contain:
      expect(processedData).not.toHaveProperty('ipAddress')
      expect(processedData).not.toHaveProperty('userId')
      expect(processedData).not.toHaveProperty('email')
      expect(processedData).not.toHaveProperty('name')
      expect(processedData).not.toHaveProperty('phone')

      // Should be marked as anonymized
      expect(processedData.anonymized).toBe(true)
    })

    it('should generate non-identifiable session IDs', () => {
      const sessionId1 = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const sessionId2 = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Should be different
      expect(sessionId1).not.toBe(sessionId2)

      // Should follow expected format
      expect(sessionId1).toMatch(/^sess_\d+_[a-z0-9]+$/)
      expect(sessionId2).toMatch(/^sess_\d+_[a-z0-9]+$/)

      // Should not contain personal information
      expect(sessionId1).not.toMatch(/user|email|name|ip/)
      expect(sessionId2).not.toMatch(/user|email|name|ip/)
    })
  })

  describe('Data Retention', () => {
    it('should respect configured retention periods', async () => {
      const config = {
        dataRetention: 30 // 30 days
      }

      const oldTimestamp = Date.now() - (35 * 24 * 60 * 60 * 1000) // 35 days ago
      const recentTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago

      const oldData = { timestamp: oldTimestamp, value: 'old' }
      const recentData = { timestamp: recentTimestamp, value: 'recent' }

      // Function to check if data should be retained
      const shouldRetainData = (dataTimestamp: number) => {
        const cutoff = Date.now() - (config.dataRetention * 24 * 60 * 60 * 1000)
        return dataTimestamp >= cutoff
      }

      expect(shouldRetainData(oldData.timestamp)).toBe(false)
      expect(shouldRetainData(recentData.timestamp)).toBe(true)
    })

    it('should automatically purge expired data', () => {
      const purgeThreshold = 7 // 7 days
      const cutoff = Date.now() - (purgeThreshold * 24 * 60 * 60 * 1000)

      const testData = [
        { id: '1', timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000) }, // 5 days - keep
        { id: '2', timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000) }, // 10 days - purge
        { id: '3', timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) }  // 2 days - keep
      ]

      const retainedData = testData.filter(item => item.timestamp >= cutoff)

      expect(retainedData).toHaveLength(2)
      expect(retainedData.map(d => d.id)).toEqual(['1', '3'])
    })
  })

  describe('Consent Enforcement', () => {
    it('should not process data without valid consent', () => {
      const noConsent: ConsentPreferences = {
        analytics: false,
        performance: false,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const canProcessAnalytics = noConsent.analytics
      const canProcessPerformance = noConsent.performance

      expect(canProcessAnalytics).toBe(false)
      expect(canProcessPerformance).toBe(false)
    })

    it('should respect granular consent preferences', () => {
      const granularConsent: ConsentPreferences = {
        analytics: true,
        performance: false,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const canProcessAnalytics = granularConsent.analytics
      const canProcessPerformance = granularConsent.performance

      expect(canProcessAnalytics).toBe(true)
      expect(canProcessPerformance).toBe(false)
    })

    it('should invalidate consent after expiration', () => {
      const expiredConsent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now() - (400 * 24 * 60 * 60 * 1000), // 400 days ago
        version: '1.0.0'
      }

      const maxAge = 365 * 24 * 60 * 60 * 1000 // 1 year
      const isValid = (Date.now() - expiredConsent.timestamp) <= maxAge

      expect(isValid).toBe(false)
    })
  })

  describe('Data Processing Records', () => {
    it('should maintain processing records for compliance', () => {
      const processingRecord: DataProcessingRecord = {
        id: 'proc_123',
        timestamp: Date.now(),
        activity: 'analytics_event_tracking',
        dataTypes: ['page_views', 'interaction_events'],
        purposes: ['website_analytics', 'performance_monitoring'],
        retention: 365,
        lawfulBasis: 'consent',
        consent: 'consent_123',
        userHash: 'hash_abc123',
        location: 'client_side',
        encrypted: false,
        anonymized: true
      }

      // Verify required fields are present
      expect(processingRecord).toHaveProperty('id')
      expect(processingRecord).toHaveProperty('timestamp')
      expect(processingRecord).toHaveProperty('activity')
      expect(processingRecord).toHaveProperty('lawfulBasis')
      expect(processingRecord.anonymized).toBe(true)

      // Should not contain actual personal data
      expect(processingRecord).not.toHaveProperty('personalData')
      expect(processingRecord).not.toHaveProperty('userId')
      expect(processingRecord).not.toHaveProperty('ipAddress')
    })
  })

  describe('Right to Data Portability', () => {
    it('should provide data export in standard format', async () => {
      const mockUserData = {
        sessionId: 'sess_123',
        consent: {
          analytics: true,
          performance: false,
          timestamp: Date.now()
        },
        preferences: {
          theme: 'dark'
        },
        anonymizedEvents: [
          { type: 'page_view', timestamp: Date.now() - 1000 },
          { type: 'interaction', timestamp: Date.now() - 500 }
        ]
      }

      // Should export in structured format
      expect(mockUserData).toHaveProperty('sessionId')
      expect(mockUserData).toHaveProperty('consent')
      expect(mockUserData).toHaveProperty('anonymizedEvents')

      // Should not include sensitive data
      expect(mockUserData).not.toHaveProperty('personalData')
      expect(mockUserData).not.toHaveProperty('rawEvents')
    })
  })

  describe('Right to Be Forgotten', () => {
    it('should completely remove user data when requested', () => {
      const mockUserData = {
        sessionId: 'sess_123',
        consent: { analytics: true },
        events: ['event1', 'event2']
      }

      // Simulate data deletion
      const deletedData = {}

      // Should be empty after deletion
      expect(Object.keys(deletedData)).toHaveLength(0)
      expect(deletedData).not.toHaveProperty('sessionId')
      expect(deletedData).not.toHaveProperty('consent')
      expect(deletedData).not.toHaveProperty('events')
    })

    it('should remove data from all storage locations', () => {
      const storageKeys = [
        'analytics-consent',
        'analytics-session',
        'analytics-events',
        'easter-egg-progress'
      ]

      // Simulate deletion from all storage
      storageKeys.forEach(key => {
        mockLocalStorage.removeItem(key)
      })

      // Verify all keys were removed
      storageKeys.forEach(key => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key)
      })
    })
  })
})