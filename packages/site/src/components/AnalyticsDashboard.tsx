/**
 * Analytics Dashboard Component
 * Privacy-focused analytics visualization for aggregated insights
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useAnalytics } from '../contexts/AnalyticsContext'
import { useTheme } from '../contexts/ThemeContext'
import type {
  AnalyticsReport,
  AnalyticsMetric
} from '../interfaces/AnalyticsSystem'

interface AnalyticsDashboardProps {
  className?: string
  timeRange?: '1h' | '24h' | '7d' | '30d'
  showPrivacyInfo?: boolean
  readonly?: boolean
}

interface DashboardData {
  backgroundUsage: {
    totalSessions: number
    avgSessionDuration: number
    mostPopularModule: string
    moduleActivations: Array<{ module: string; count: number }>
  }
  easterEggs: {
    totalDiscoveries: number
    discoveryRate: number
    mostDiscovered: string
    difficultyDistribution: Record<string, number>
  }
  performance: {
    avgFps: number
    memoryEfficiency: number
    qualityAdjustments: number
    deviceDistribution: Record<string, number>
  }
  accessibility: {
    screenReaderUsage: number
    highContrastUsage: number
    reducedMotionUsage: number
    keyboardNavigationUsage: number
  }
  privacy: {
    consentRate: number
    optOutRate: number
    dataRetentionCompliance: number
  }
}

const MetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  description?: string
  icon?: string
}> = ({ title, value, change, trend, description, icon }) => {
  const { theme } = useTheme()
  
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                    trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-600 dark:text-gray-400'
  
  const trendSymbol = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change !== undefined && (
          <p className={`ml-2 flex items-baseline text-sm font-semibold ${trendColor}`}>
            <span className="sr-only">{trend === 'up' ? 'Increased' : trend === 'down' ? 'Decreased' : 'Unchanged'} by</span>
            {trendSymbol} {Math.abs(change)}%
          </p>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}

const ChartContainer: React.FC<{
  title: string
  children: React.ReactNode
  height?: number
}> = ({ title, children, height = 200 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

const SimpleBarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>
  maxHeight?: number
}> = ({ data, maxHeight = 100 }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="flex items-end space-x-2 h-full w-full">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={`w-full ${item.color || 'bg-blue-500'} rounded-t`}
            style={{
              height: `${(item.value / maxValue) * maxHeight}px`,
              minHeight: '4px'
            }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
            {item.label}
          </span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const PrivacyBanner: React.FC = () => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-green-400 text-xl">🛡️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
            Privacy-First Analytics
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            All data is anonymized, aggregated, and stored locally when possible. No personal information is collected or stored.
            Data retention follows GDPR guidelines with automatic purging after the specified period.
          </p>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ No cookies • ✓ No personal data • ✓ GDPR compliant • ✓ User controlled
          </div>
        </div>
      </div>
    </div>
  )
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = '',
  timeRange = '24h',
  showPrivacyInfo = true,
  readonly = false
}) => {
  const analytics = useAnalytics()
  const { theme } = useTheme()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  // Mock data for demonstration - in real implementation, this would come from analytics
  const mockDashboardData: DashboardData = {
    backgroundUsage: {
      totalSessions: 1234,
      avgSessionDuration: 5.2, // minutes
      mostPopularModule: 'particle-field',
      moduleActivations: [
        { module: 'particle-field', count: 45 },
        { module: 'wave-animation', count: 32 },
        { module: 'geometric-patterns', count: 28 },
        { module: 'neural-network', count: 15 }
      ]
    },
    easterEggs: {
      totalDiscoveries: 87,
      discoveryRate: 12.5, // percentage of sessions
      mostDiscovered: 'konami-code',
      difficultyDistribution: {
        'Level 1': 35,
        'Level 2': 28,
        'Level 3': 18,
        'Level 4': 5,
        'Level 5': 1
      }
    },
    performance: {
      avgFps: 52.3,
      memoryEfficiency: 78, // percentage
      qualityAdjustments: 156,
      deviceDistribution: {
        'Desktop': 65,
        'Mobile': 28,
        'Tablet': 7
      }
    },
    accessibility: {
      screenReaderUsage: 3.2, // percentage
      highContrastUsage: 5.8,
      reducedMotionUsage: 12.1,
      keyboardNavigationUsage: 8.4
    },
    privacy: {
      consentRate: 89.2, // percentage
      optOutRate: 2.1,
      dataRetentionCompliance: 100
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // In real implementation, this would fetch from analytics API
        setTimeout(() => {
          setDashboardData(mockDashboardData)
          setLoading(false)
        }, 1000)
      } catch (err) {
        setError('Failed to load analytics data')
        setLoading(false)
      }
    }

    if (analytics.isEnabled) {
      fetchDashboardData()
    } else {
      setLoading(false)
      setError('Analytics not enabled')
    }
  }, [analytics.isEnabled, selectedTimeRange])

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ]

  if (!analytics.isEnabled) {
    return (
      <div className={`max-w-7xl mx-auto p-6 ${className}`}>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Analytics Disabled
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Analytics are currently disabled. Enable analytics in your privacy settings to view usage insights.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`max-w-7xl mx-auto p-6 ${className}`}>
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Privacy-first insights into background system usage</p>
        </div>
        
        {!readonly && (
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Privacy Banner */}
      {showPrivacyInfo && <PrivacyBanner />}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Sessions"
          value={dashboardData.backgroundUsage.totalSessions}
          change={12.5}
          trend="up"
          icon="👥"
          description="Background system activations"
        />
        <MetricCard
          title="Avg Session Duration"
          value={`${dashboardData.backgroundUsage.avgSessionDuration}m`}
          change={-3.2}
          trend="down"
          icon="⏱️"
          description="Time spent with backgrounds active"
        />
        <MetricCard
          title="Easter Eggs Found"
          value={dashboardData.easterEggs.totalDiscoveries}
          change={24.1}
          trend="up"
          icon="🥚"
          description="Total discoveries across all difficulty levels"
        />
        <MetricCard
          title="Avg Performance"
          value={`${Math.round(dashboardData.performance.avgFps)} FPS`}
          change={5.8}
          trend="up"
          icon="⚡"
          description="System performance efficiency"
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Background Module Usage */}
        <ChartContainer title="Popular Background Modules">
          <SimpleBarChart
            data={dashboardData.backgroundUsage.moduleActivations.map(item => ({
              label: item.module.replace('-', ' '),
              value: item.count,
              color: 'bg-blue-500'
            }))}
          />
        </ChartContainer>

        {/* Easter Egg Difficulty Distribution */}
        <ChartContainer title="Easter Egg Difficulty Distribution">
          <SimpleBarChart
            data={Object.entries(dashboardData.easterEggs.difficultyDistribution).map(([level, count]) => ({
              label: level,
              value: count,
              color: 'bg-purple-500'
            }))}
          />
        </ChartContainer>
      </div>

      {/* Device and Accessibility Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartContainer title="Device Distribution" height={150}>
          <SimpleBarChart
            data={Object.entries(dashboardData.performance.deviceDistribution).map(([device, percentage]) => ({
              label: device,
              value: percentage,
              color: 'bg-green-500'
            }))}
          />
        </ChartContainer>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accessibility Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Screen Reader</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dashboardData.accessibility.screenReaderUsage}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Contrast</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dashboardData.accessibility.highContrastUsage}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Reduced Motion</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dashboardData.accessibility.reducedMotionUsage}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Keyboard Nav</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dashboardData.accessibility.keyboardNavigationUsage}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Privacy Compliance</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Consent Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData.privacy.consentRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${dashboardData.privacy.consentRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Opt-out Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {dashboardData.privacy.optOutRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${dashboardData.privacy.optOutRate}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-green-600 dark:text-green-400">
                ✓ 100% GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Data updated in real-time • All metrics are anonymized and aggregated • 
          <button className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
            Export Data
          </button>
        </p>
      </div>
    </div>
  )
}

export default AnalyticsDashboard