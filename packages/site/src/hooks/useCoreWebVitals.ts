/**
 * Hook for Core Web Vitals monitoring
 * Provides easy integration with React components
 */

import { useEffect, useState, useCallback } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import CoreWebVitalsMonitor, { 
  CoreWebVitalsData, 
  CoreWebVitalsConfig 
} from '../utils/CoreWebVitalsMonitor';

interface UseCoreWebVitalsResult {
  metrics: CoreWebVitalsData;
  ratings: Record<keyof CoreWebVitalsData, 'good' | 'needs-improvement' | 'poor' | null>;
  overallScore: number;
  isSupported: boolean;
  refresh: () => void;
}

export const useCoreWebVitals = (config?: Partial<CoreWebVitalsConfig>): UseCoreWebVitalsResult => {
  const analytics = useAnalytics();
  const [monitor, setMonitor] = useState<CoreWebVitalsMonitor | null>(null);
  const [metrics, setMetrics] = useState<CoreWebVitalsData>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  });
  const [ratings, setRatings] = useState<Record<keyof CoreWebVitalsData, 'good' | 'needs-improvement' | 'poor' | null>>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  });
  const [overallScore, setOverallScore] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const handleMetricUpdate = useCallback((
    metric: keyof CoreWebVitalsData, 
    value: number, 
    rating: 'good' | 'needs-improvement' | 'poor'
  ) => {
    setMetrics(prev => ({ ...prev, [metric]: value }));
    setRatings(prev => ({ ...prev, [metric]: rating }));
    
    // Report to analytics if enabled
    if (analytics.isEnabled) {
      analytics.trackEvent({
        name: 'core_web_vital_measured',
        data: {
          metric,
          value,
          rating,
          timestamp: Date.now(),
          privacy: {
            anonymized: true,
            performanceMetricsOnly: true
          }
        }
      });
    }
  }, [analytics]);

  const handleReport = useCallback((data: CoreWebVitalsData) => {
    setMetrics(data);
    
    // Report batch to analytics
    if (analytics.isEnabled) {
      const nonNullMetrics = Object.entries(data)
        .filter(([_, value]) => value !== null)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(nonNullMetrics).length > 0) {
        analytics.trackEvent({
          name: 'core_web_vitals_batch_report',
          data: {
            metrics: nonNullMetrics,
            timestamp: Date.now(),
            privacy: {
              anonymized: true,
              aggregatedMetricsOnly: true
            }
          }
        });
      }
    }
  }, [analytics]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    const monitorConfig: Partial<CoreWebVitalsConfig> = {
      onMetric: handleMetricUpdate,
      onReport: handleReport,
      ...config
    };

    try {
      const cwvMonitor = new CoreWebVitalsMonitor(monitorConfig);
      setMonitor(cwvMonitor);
      setIsSupported(true);

      return () => {
        cwvMonitor.destroy();
      };
    } catch (error) {
      console.warn('Core Web Vitals monitoring not supported:', error);
      setIsSupported(false);
    }
  }, [handleMetricUpdate, handleReport, config]);

  useEffect(() => {
    if (monitor) {
      setRatings(monitor.getMetricRatings());
      setOverallScore(monitor.getOverallScore());
    }
  }, [monitor, metrics]);

  const refresh = useCallback(() => {
    if (monitor) {
      const currentMetrics = monitor.getMetrics();
      setMetrics(currentMetrics);
      setRatings(monitor.getMetricRatings());
      setOverallScore(monitor.getOverallScore());
    }
  }, [monitor]);

  return {
    metrics,
    ratings,
    overallScore,
    isSupported,
    refresh
  };
};

export default useCoreWebVitals;