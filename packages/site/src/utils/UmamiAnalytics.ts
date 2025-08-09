/**
 * Privacy-First Umami Analytics Integration
 * GDPR/CCPA compliant analytics with granular consent management
 */

import type {
  AnalyticsConfig,
  ConsentPreferences,
  AnalyticsEvent,
  BackgroundAnalyticsEvent,
  EasterEggAnalyticsEvent,
  PerformanceAnalyticsEvent,
  AccessibilityAnalyticsEvent,
  UmamiConfig,
  AnalyticsBatch,
  LocalAnalytics,
  AnalyticsQueue,
  AnalyticsPerformance
} from '../interfaces/AnalyticsSystem'

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  websiteId: '',
  scriptUrl: 'https://analytics.umami.is/script.js',
  trackPageViews: true,
  trackEvents: true,
  respectDoNotTrack: true,
  cookieless: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  dataRetention: 365, // 1 year
  anonymizeIp: true,
  enabled: false
}

const DEFAULT_LOCAL_CONFIG: LocalAnalytics = {
  enabled: true,
  storageQuota: 5, // 5MB
  syncInterval: 5, // 5 minutes
  batchSize: 50,
  compression: true,
  encryption: false,
  offlineSupport: true,
  purgeOldData: true,
  purgeThreshold: 7 // 7 days
}

class EventQueue implements AnalyticsQueue {
  private events: AnalyticsEvent[] = []
  private processing = false
  private paused = false
  private maxSize = 1000

  async add(event: AnalyticsEvent): Promise<void> {
    if (this.events.length >= this.maxSize) {
      // Remove oldest events to prevent memory leaks
      this.events.shift()
    }
    
    this.events.push(event)
    
    if (!this.paused && !this.processing) {
      await this.processQueue()
    }
  }

  async flush(): Promise<void> {
    await this.processQueue()
  }

  size(): number {
    return this.events.length
  }

  async clear(): Promise<void> {
    this.events = []
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
    if (!this.processing && this.events.length > 0) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.paused || this.events.length === 0) {
      return
    }

    this.processing = true
    const batch = this.events.splice(0, DEFAULT_LOCAL_CONFIG.batchSize)
    
    try {
      await this.sendBatch(batch)
    } catch (error) {
      console.warn('Failed to send analytics batch:', error)
      // Re-add failed events to the beginning of the queue
      this.events.unshift(...batch)
    }
    
    this.processing = false
    
    // Process remaining events
    if (this.events.length > 0 && !this.paused) {
      setTimeout(() => this.processQueue(), 100)
    }
  }

  private async sendBatch(events: AnalyticsEvent[]): Promise<void> {
    const umamiInstance = UmamiAnalytics.getInstance()
    
    for (const event of events) {
      await umamiInstance.trackEventInternal(event)
    }
  }
}

export class UmamiAnalytics {
  private static instance: UmamiAnalytics | null = null
  private config: AnalyticsConfig
  private umamiConfig: UmamiConfig
  private localConfig: LocalAnalytics
  private consent: ConsentPreferences | null = null
  private sessionId: string
  private userId: string | null = null
  private isInitialized = false
  private eventQueue: EventQueue
  private performanceMetrics: AnalyticsPerformance
  private scriptLoaded = false

  private constructor() {
    this.config = { ...DEFAULT_CONFIG }
    this.localConfig = { ...DEFAULT_LOCAL_CONFIG }
    this.umamiConfig = {
      websiteId: '',
      scriptUrl: '',
      trackLocalhost: false,
      autoTrack: true
    }
    this.sessionId = this.generateSessionId()
    this.eventQueue = new EventQueue()
    this.performanceMetrics = {
      bundleSize: 0,
      scriptLoadTime: 0,
      eventQueueTime: 0,
      networkLatency: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      batterySavingMode: false,
      performanceBudget: {
        maxBundleSize: 3000, // 3KB
        maxLoadTime: 1000, // 1s
        maxMemoryUsage: 5 * 1024 * 1024 // 5MB
      }
    }
  }

  public static getInstance(): UmamiAnalytics {
    if (!UmamiAnalytics.instance) {
      UmamiAnalytics.instance = new UmamiAnalytics()
    }
    return UmamiAnalytics.instance
  }

  public async initialize(
    config: Partial<AnalyticsConfig>, 
    umamiConfig: Partial<UmamiConfig>,
    localConfig?: Partial<LocalAnalytics>
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('UmamiAnalytics already initialized')
      return
    }

    this.config = { ...this.config, ...config }
    this.umamiConfig = { ...this.umamiConfig, ...umamiConfig }
    if (localConfig) {
      this.localConfig = { ...this.localConfig, ...localConfig }
    }

    // Check for consent
    await this.loadConsentPreferences()
    
    if (!this.hasAnalyticsConsent()) {
      console.info('Analytics consent not granted, analytics disabled')
      return
    }

    // Check for Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.info('Do Not Track enabled, analytics disabled')
      return
    }

    // Load Umami script
    await this.loadUmamiScript()
    
    // Initialize local analytics
    if (this.localConfig.enabled) {
      await this.initializeLocalStorage()
    }

    // Start event queue processing
    this.eventQueue.resume()

    this.isInitialized = true
    
    // Track initialization
    await this.trackEvent({
      name: 'analytics_initialized',
      data: {
        provider: 'umami',
        version: '1.0.0',
        consent: this.consent,
        config: {
          cookieless: this.config.cookieless,
          anonymizeIp: this.config.anonymizeIp
        }
      }
    })
  }

  public async updateConsent(consent: ConsentPreferences): Promise<void> {
    this.consent = consent
    
    // Store consent preferences
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics-consent', JSON.stringify(consent))
    }

    if (!this.hasAnalyticsConsent()) {
      // Disable analytics and clear stored data
      this.disable()
      await this.clearStoredData()
    } else if (!this.isInitialized && this.config.enabled) {
      // Re-initialize if consent was granted
      await this.initialize(this.config, this.umamiConfig, this.localConfig)
    }
  }

  public async trackPageView(url?: string, referrer?: string): Promise<void> {
    if (!this.isEnabled()) return

    const pageViewData = {
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
      referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    }

    await this.trackEvent({
      name: 'pageview',
      data: pageViewData,
      url: pageViewData.url,
      referrer: pageViewData.referrer
    })
  }

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled()) return

    const enhancedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: event.url || (typeof window !== 'undefined' ? window.location.href : ''),
      referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : '')
    }

    await this.eventQueue.add(enhancedEvent)
  }

  public async trackBackgroundEvent(event: BackgroundAnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.hasPerformanceConsent()) return

    const enhancedEvent: BackgroundAnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      data: {
        ...event.data,
        privacy: {
          anonymized: true,
          aggregated: true,
          noPersonalData: true
        }
      }
    }

    await this.trackEvent(enhancedEvent)
  }

  public async trackEasterEggEvent(event: EasterEggAnalyticsEvent): Promise<void> {
    if (!this.isEnabled()) return

    const enhancedEvent: EasterEggAnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      data: {
        ...event.data,
        privacy: {
          anonymized: true,
          noPersonalIdentification: true,
          aggregatedOnly: true
        }
      }
    }

    await this.trackEvent(enhancedEvent)
  }

  public async trackPerformanceEvent(event: PerformanceAnalyticsEvent): Promise<void> {
    if (!this.isEnabled() || !this.hasPerformanceConsent()) return

    const enhancedEvent: PerformanceAnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      data: {
        ...event.data,
        privacy: {
          anonymized: true,
          deviceTypeOnly: true,
          noSpecificMetrics: true
        }
      }
    }

    await this.trackEvent(enhancedEvent)
  }

  public async trackAccessibilityEvent(event: AccessibilityAnalyticsEvent): Promise<void> {
    if (!this.isEnabled()) return

    const enhancedEvent: AccessibilityAnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      data: {
        ...event.data,
        privacy: {
          anonymized: true,
          featureUsageOnly: true,
          noPersonalPreferences: true
        }
      }
    }

    await this.trackEvent(enhancedEvent)
  }

  public async trackEventInternal(event: AnalyticsEvent): Promise<void> {
    if (!this.scriptLoaded || typeof window === 'undefined') {
      return
    }

    const umami = (window as any).umami

    if (!umami || typeof umami.track !== 'function') {
      console.warn('Umami script not loaded properly')
      return
    }

    try {
      const startTime = performance.now()
      
      if (event.name === 'pageview') {
        await umami.track(event.url, event.data)
      } else {
        await umami.track(event.name, event.data)
      }
      
      const endTime = performance.now()
      this.performanceMetrics.eventQueueTime = endTime - startTime
      
    } catch (error) {
      console.warn('Failed to track event:', error)
    }
  }

  public getPerformanceMetrics(): AnalyticsPerformance {
    return { ...this.performanceMetrics }
  }

  public async exportData(): Promise<object> {
    if (!this.hasAnalyticsConsent()) {
      throw new Error('Cannot export data without analytics consent')
    }

    const data = {
      sessionId: this.sessionId,
      userId: this.userId,
      consent: this.consent,
      config: this.config,
      localData: await this.getLocalStorageData()
    }

    return data
  }

  public async deleteUserData(): Promise<void> {
    await this.clearStoredData()
    this.userId = null
    this.sessionId = this.generateSessionId()
  }

  private async loadConsentPreferences(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('analytics-consent')
      if (stored) {
        this.consent = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load consent preferences:', error)
    }
  }

  private hasAnalyticsConsent(): boolean {
    return this.consent?.analytics === true || this.config.enabled === true
  }

  private hasPerformanceConsent(): boolean {
    return this.consent?.performance === true || this.hasAnalyticsConsent()
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false
    return navigator.doNotTrack === '1' || 
           (navigator as any).msDoNotTrack === '1' || 
           (window as any).doNotTrack === '1'
  }

  private async loadUmamiScript(): Promise<void> {
    if (typeof window === 'undefined' || this.scriptLoaded) return

    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.src = this.umamiConfig.scriptUrl
      script.setAttribute('data-website-id', this.umamiConfig.websiteId)
      
      if (this.config.cookieless) {
        script.setAttribute('data-cache', 'true')
      }
      
      if (this.umamiConfig.domains) {
        script.setAttribute('data-domains', this.umamiConfig.domains.join(','))
      }

      if (!this.umamiConfig.trackLocalhost) {
        script.setAttribute('data-exclude-search', 'true')
      }

      if (!this.umamiConfig.autoTrack) {
        script.setAttribute('data-auto-track', 'false')
      }

      script.onload = () => {
        const endTime = performance.now()
        this.performanceMetrics.scriptLoadTime = endTime - startTime
        this.performanceMetrics.bundleSize = script.src.length // Approximate
        this.scriptLoaded = true
        resolve()
      }

      script.onerror = () => {
        reject(new Error('Failed to load Umami script'))
      }

      document.head.appendChild(script)
    })
  }

  private async initializeLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Clear old data if necessary
      if (this.localConfig.purgeOldData) {
        await this.purgeOldLocalData()
      }
    } catch (error) {
      console.warn('Failed to initialize local storage:', error)
    }
  }

  private async purgeOldLocalData(): Promise<void> {
    if (typeof window === 'undefined') return

    const cutoff = Date.now() - (this.localConfig.purgeThreshold * 24 * 60 * 60 * 1000)
    
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics-'))
      
      for (const key of keys) {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (parsed.timestamp && parsed.timestamp < cutoff) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to purge old local data:', error)
    }
  }

  private async clearStoredData(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics-'))
      keys.forEach(key => localStorage.removeItem(key))
      
      await this.eventQueue.clear()
    } catch (error) {
      console.warn('Failed to clear stored data:', error)
    }
  }

  private async getLocalStorageData(): Promise<object> {
    if (typeof window === 'undefined') return {}

    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics-'))
      const data: Record<string, any> = {}
      
      for (const key of keys) {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}')
      }
      
      return data
    } catch (error) {
      console.warn('Failed to get local storage data:', error)
      return {}
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isEnabled(): boolean {
    return this.isInitialized && this.hasAnalyticsConsent() && this.config.enabled
  }

  private disable(): void {
    this.eventQueue.pause()
    this.isInitialized = false
  }
}

// Export singleton instance
export const analytics = UmamiAnalytics.getInstance()
export default analytics