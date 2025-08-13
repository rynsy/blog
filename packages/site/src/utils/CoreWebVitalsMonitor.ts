/**
 * Core Web Vitals Monitor
 * Tracks essential web performance metrics for user experience insights
 */

export interface CoreWebVitalsData {
  lcp: number | null;       // Largest Contentful Paint
  fid: number | null;       // First Input Delay  
  cls: number | null;       // Cumulative Layout Shift
  fcp: number | null;       // First Contentful Paint
  ttfb: number | null;      // Time to First Byte
  inp: number | null;       // Interaction to Next Paint (new metric)
}

export interface CoreWebVitalsThresholds {
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  fcp: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  inp: { good: number; poor: number };
}

export interface CoreWebVitalsConfig {
  reportInterval: number;
  enableReporting: boolean;
  thresholds: CoreWebVitalsThresholds;
  onMetric?: (metric: keyof CoreWebVitalsData, value: number, rating: 'good' | 'needs-improvement' | 'poor') => void;
  onReport?: (data: CoreWebVitalsData) => void;
}

const DEFAULT_THRESHOLDS: CoreWebVitalsThresholds = {
  lcp: { good: 2500, poor: 4000 },      // ms
  fid: { good: 100, poor: 300 },        // ms
  cls: { good: 0.1, poor: 0.25 },       // ratio
  fcp: { good: 1800, poor: 3000 },      // ms
  ttfb: { good: 800, poor: 1800 },      // ms
  inp: { good: 200, poor: 500 }         // ms
};

const DEFAULT_CONFIG: CoreWebVitalsConfig = {
  reportInterval: 30000, // 30 seconds
  enableReporting: true,
  thresholds: DEFAULT_THRESHOLDS
};

export class CoreWebVitalsMonitor {
  private config: CoreWebVitalsConfig;
  private metrics: CoreWebVitalsData = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  };
  private observers: PerformanceObserver[] = [];
  private reportTimer: number | null = null;
  private isSupported = false;

  constructor(config: Partial<CoreWebVitalsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeObservers();
      this.startReporting();
    }
  }

  private checkSupport(): boolean {
    return typeof window !== 'undefined' && 
           'PerformanceObserver' in window &&
           'performance' in window;
  }

  private initializeObservers() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        
        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.updateMetric('lcp', value);
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart) {
            const value = fidEntry.processingStart - entry.startTime;
            this.updateMetric('fid', value);
          }
        });
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  private observeCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { 
            value?: number; 
            hadRecentInput?: boolean;
          };
          
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            sessionValue += layoutShiftEntry.value;
            sessionEntries.push(entry);
            
            // Check if we should finalize the session
            if (this.shouldEndCLSSession(sessionEntries)) {
              clsValue = Math.max(clsValue, sessionValue);
              this.updateMetric('cls', clsValue);
              sessionValue = 0;
              sessionEntries = [];
            }
          }
        });
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  private shouldEndCLSSession(entries: PerformanceEntry[]): boolean {
    if (entries.length < 2) return false;
    
    const lastEntry = entries[entries.length - 1];
    const firstEntry = entries[0];
    
    // End session if gap > 1 second or session > 5 seconds
    return (lastEntry.startTime - firstEntry.startTime > 5000) ||
           (entries.length > 1 && 
            lastEntry.startTime - entries[entries.length - 2].startTime > 1000);
  }

  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('fcp', entry.startTime);
          }
        });
      });
      
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observation not supported:', error);
    }
  }

  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.fetchStart;
        this.updateMetric('ttfb', ttfb);
      }
    } catch (error) {
      console.warn('TTFB measurement not supported:', error);
    }
  }

  private observeINP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let maxDelay = 0;
        
        entries.forEach((entry) => {
          const eventEntry = entry as PerformanceEntry & { 
            processingStart?: number;
            processingEnd?: number;
          };
          
          if (eventEntry.processingStart && eventEntry.processingEnd) {
            const delay = eventEntry.processingEnd - entry.startTime;
            maxDelay = Math.max(maxDelay, delay);
          }
        });
        
        if (maxDelay > 0) {
          this.updateMetric('inp', maxDelay);
        }
      });
      
      observer.observe({ type: 'event', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('INP observation not supported:', error);
    }
  }

  private updateMetric(metric: keyof CoreWebVitalsData, value: number) {
    this.metrics[metric] = value;
    
    if (this.config.onMetric) {
      const rating = this.getRating(metric, value);
      this.config.onMetric(metric, value, rating);
    }
  }

  private getRating(metric: keyof CoreWebVitalsData, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.config.thresholds[metric];
    
    if (value <= threshold.good) {
      return 'good';
    } else if (value <= threshold.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  private startReporting() {
    if (!this.config.enableReporting || !this.config.onReport) return;
    
    this.reportTimer = window.setInterval(() => {
      this.config.onReport!(this.metrics);
    }, this.config.reportInterval);
  }

  public getMetrics(): CoreWebVitalsData {
    return { ...this.metrics };
  }

  public getMetricRatings() {
    const ratings: Record<keyof CoreWebVitalsData, 'good' | 'needs-improvement' | 'poor' | null> = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null
    };

    Object.keys(this.metrics).forEach((key) => {
      const metric = key as keyof CoreWebVitalsData;
      const value = this.metrics[metric];
      if (value !== null) {
        ratings[metric] = this.getRating(metric, value);
      }
    });

    return ratings;
  }

  public getOverallScore(): number {
    const ratings = this.getMetricRatings();
    const scores: Record<string, number> = { 'good': 100, 'needs-improvement': 50, 'poor': 0 };
    
    let totalScore = 0;
    let validMetrics = 0;
    
    Object.values(ratings).forEach((rating) => {
      if (rating !== null) {
        totalScore += scores[rating];
        validMetrics++;
      }
    });
    
    return validMetrics > 0 ? Math.round(totalScore / validMetrics) : 0;
  }

  public destroy() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];
    
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }
}

export default CoreWebVitalsMonitor;