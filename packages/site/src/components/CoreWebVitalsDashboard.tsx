/**
 * Core Web Vitals Dashboard Component
 * Displays real-time web performance metrics
 */

import React from 'react';
import { useCoreWebVitals } from '../hooks/useCoreWebVitals';
import { useTheme } from '../contexts/ThemeContext';
import type { CoreWebVitalsData } from '../utils/CoreWebVitalsMonitor';

interface CoreWebVitalsDashboardProps {
  className?: string;
  compact?: boolean;
  showTooltips?: boolean;
}

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  description: string;
  thresholds: { good: number; poor: number };
  showTooltip?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  rating,
  description,
  thresholds,
  showTooltip = false
}) => {
  const { theme } = useTheme();
  
  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'needs-improvement':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'poor':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatValue = (val: number | null) => {
    if (val === null) return 'N/A';
    if (unit === 'ms') return Math.round(val);
    if (unit === '') return val.toFixed(3);
    return val.toFixed(1);
  };

  const getRatingIcon = (rating: string | null) => {
    switch (rating) {
      case 'good': return '✅';
      case 'needs-improvement': return '⚠️';
      case 'poor': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getRatingColor(rating)} relative group`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-lg">{getRatingIcon(rating)}</span>
      </div>
      
      <div className="flex items-baseline">
        <span className="text-2xl font-bold">
          {formatValue(value)}
        </span>
        <span className="ml-1 text-sm opacity-75">{unit}</span>
      </div>
      
      <div className="mt-2 text-xs opacity-75">
        Good: ≤{thresholds.good}{unit} • Poor: >{thresholds.poor}{unit}
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <p className="font-medium mb-1">{label}</p>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

const OverallScoreCard: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Overall Performance Score
        </h2>
        <div className={`text-4xl font-bold ${getScoreColor(score)} mb-1`}>
          {score}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {getScoreLabel(score)}
        </div>
      </div>
    </div>
  );
};

export const CoreWebVitalsDashboard: React.FC<CoreWebVitalsDashboardProps> = ({
  className = '',
  compact = false,
  showTooltips = true
}) => {
  const { metrics, ratings, overallScore, isSupported, refresh } = useCoreWebVitals();

  if (!isSupported) {
    return (
      <div className={`p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-2 block">⚠️</span>
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Web Vitals Not Supported
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Your browser doesn't support the Performance Observer API required for Core Web Vitals monitoring.
          </p>
        </div>
      </div>
    );
  }

  const metricDefinitions = {
    lcp: {
      label: 'Largest Contentful Paint',
      unit: 'ms',
      description: 'Time until the largest content element is rendered',
      thresholds: { good: 2500, poor: 4000 }
    },
    fcp: {
      label: 'First Contentful Paint',
      unit: 'ms',
      description: 'Time until the first content element is rendered',
      thresholds: { good: 1800, poor: 3000 }
    },
    fid: {
      label: 'First Input Delay',
      unit: 'ms',
      description: 'Time from first user interaction to browser response',
      thresholds: { good: 100, poor: 300 }
    },
    inp: {
      label: 'Interaction to Next Paint',
      unit: 'ms',
      description: 'Time from user interaction to next visual update',
      thresholds: { good: 200, poor: 500 }
    },
    cls: {
      label: 'Cumulative Layout Shift',
      unit: '',
      description: 'Amount of unexpected layout shifts during page load',
      thresholds: { good: 0.1, poor: 0.25 }
    },
    ttfb: {
      label: 'Time to First Byte',
      unit: 'ms',
      description: 'Time from navigation to first response byte',
      thresholds: { good: 800, poor: 1800 }
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Core Web Vitals
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time performance metrics for user experience
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {!compact && <OverallScoreCard score={overallScore} />}
        
        {Object.entries(metricDefinitions).map(([key, definition]) => (
          <MetricCard
            key={key}
            label={definition.label}
            value={metrics[key as keyof CoreWebVitalsData]}
            unit={definition.unit}
            rating={ratings[key as keyof CoreWebVitalsData]}
            description={definition.description}
            thresholds={definition.thresholds}
            showTooltip={showTooltips}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <span className="text-blue-500 text-xl mr-3">💡</span>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Performance Tips</p>
            <ul className="space-y-1 text-xs">
              <li>• LCP: Optimize server response times and remove render-blocking resources</li>
              <li>• FID/INP: Minimize JavaScript execution time and avoid blocking the main thread</li>
              <li>• CLS: Set explicit dimensions for images and avoid dynamically inserted content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreWebVitalsDashboard;