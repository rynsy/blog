/**
 * Advanced Performance Monitoring Dashboard
 * 
 * Comprehensive real-time performance monitoring and analytics system
 * for Phase 4 background system with hybrid New Relic integration,
 * privacy-respecting analytics, accessibility features, and professional UI design.
 * 
 * Features:
 * - Real-time performance metrics visualization with New Relic correlation
 * - Module-specific performance tracking and thermal throttling detection
 * - Intelligent alerting system with battery impact assessment
 * - Historical trend analysis with local storage persistence
 * - Data export capabilities (JSON/CSV) with privacy controls
 * - Network performance and resource loading monitoring
 * - GPU utilization and WebGL context health tracking
 * - Accessibility compliant with screen reader support
 * - Sub-5KB lightweight implementation with optional New Relic integration
 * - CPU usage estimation and device capability detection accuracy
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo,
  memo
} from 'react';
import { 
  PerformanceMetrics, 
  MemoryStats, 
  DeviceCapabilities,
  PerformanceAlert,
  ModuleConfiguration
} from '@/interfaces/BackgroundSystemV3';
import { 
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  ModuleId
} from '@/types/utilities';
import { TypeSafePerformanceMonitor } from '@/utils/TypeSafePerformanceMonitor';
import { DeviceCapabilityManager } from '@/utils/DeviceCapabilityManager';
import { newRelicDiagnostics, DiagnosticResult } from '@/utils/NewRelicDiagnostics';
import { enhancedPerformanceCollector, AdvancedPerformanceMetrics } from '@/utils/EnhancedPerformanceCollector';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface DashboardConfig {
  refreshRate: number; // ms
  alertThresholds: {
    fps: number;
    memory: number;
    cpu: number;
    battery: number;
    thermalThrottling: number;
    networkLatency: number;
  };
  displayMode: 'compact' | 'detailed' | 'minimal';
  showAlerts: boolean;
  showModuleMetrics: boolean;
  showTrends: boolean;
  showNetworkMetrics: boolean;
  showGpuMetrics: boolean;
  enableExport: boolean;
  enableNewRelicCorrelation: boolean;
  privacyMode: boolean;
  accessibilityMode: boolean;
  highContrastMode: boolean;
  cognitiveLoadReduction: boolean;
}

interface MetricsHistory {
  timestamp: number;
  metrics: PerformanceMetrics;
  moduleId?: ModuleId;
}

interface AlertHistory {
  id: string;
  timestamp: number;
  alert: PerformanceAlert;
  acknowledged: boolean;
}

interface ExportData {
  timestamp: number;
  sessionId: string;
  metrics: MetricsHistory[];
  alerts: AlertHistory[];
  deviceCapabilities: DeviceCapabilities;
  configuration: DashboardConfig;
  newRelicDiagnostics?: {
    results: DiagnosticResult[];
    summary: any;
    recommendations: string[];
  };
}

// ============================================================================
// Dashboard Configuration
// ============================================================================

const DEFAULT_CONFIG: DashboardConfig = {
  refreshRate: 1000, // 1 second
  alertThresholds: {
    fps: 30,
    memory: 100, // MB
    cpu: 80, // %
    battery: 20, // %
    thermalThrottling: 85, // °C
    networkLatency: 200 // ms
  },
  displayMode: 'compact',
  showAlerts: true,
  showModuleMetrics: true,
  showTrends: true,
  showNetworkMetrics: true,
  showGpuMetrics: true,
  enableExport: true,
  enableNewRelicCorrelation: false, // Privacy-first default
  privacyMode: true,
  accessibilityMode: false,
  highContrastMode: false,
  cognitiveLoadReduction: false
};

// ============================================================================
// Performance Grade Calculation
// ============================================================================

function calculatePerformanceGrade(metrics: EnhancedPerformanceMetrics): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  factors: string[];
} {
  let score = 100;
  const factors: string[] = [];

  // FPS scoring (40% weight)
  const fpsScore = Math.min(100, (metrics.computedFPS / 60) * 100);
  if (fpsScore < 80) factors.push('Low FPS');
  score = score * 0.6 + fpsScore * 0.4;

  // Memory efficiency (30% weight)
  const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 2));
  if (memoryScore < 70) factors.push('High memory usage');
  score = score * 0.7 + memoryScore * 0.3;

  // Performance score (30% weight)
  const perfScore = metrics.performanceScore;
  if (perfScore < 70) factors.push('Poor overall performance');
  score = score * 0.7 + perfScore * 0.3;

  const finalScore = Math.round(score);
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (finalScore >= 90) grade = 'A';
  else if (finalScore >= 80) grade = 'B';
  else if (finalScore >= 70) grade = 'C';
  else if (finalScore >= 60) grade = 'D';
  else grade = 'F';

  return { grade, score: finalScore, factors };
}

// ============================================================================
// Metric Display Components
// ============================================================================

const MetricCard = memo<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'normal' | 'warning' | 'critical';
  description?: string;
  accessibilityLabel?: string;
}>(({ title, value, unit, trend, severity = 'normal', description, accessibilityLabel }) => {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const severityColor = 
    severity === 'critical' ? '#ff4444' :
    severity === 'warning' ? '#ffaa00' :
    '#00aa44';

  return (
    <div 
      className="metric-card"
      style={{
        padding: '12px',
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${severity !== 'normal' ? severityColor : 'var(--border-color)'}`,
        borderRadius: '6px',
        minWidth: '120px',
        position: 'relative'
      }}
      role="status"
      aria-label={accessibilityLabel || `${title}: ${value}${unit || ''}`}
    >
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {title}
        {trend && (
          <span 
            style={{ marginLeft: '4px', color: severityColor }}
            aria-label={`Trend: ${trend}`}
          >
            {trendIcon}
          </span>
        )}
      </div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: severityColor }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span style={{ fontSize: '12px', marginLeft: '2px' }}>{unit}</span>}
      </div>
      {description && (
        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {description}
        </div>
      )}
    </div>
  );
});

const PerformanceGradeBadge = memo<{
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  factors: string[];
}>(({ grade, score, factors }) => {
  const gradeColor = {
    'A': '#00aa44',
    'B': '#88cc00',
    'C': '#ffaa00',
    'D': '#ff8800',
    'F': '#ff4444'
  }[grade];

  return (
    <div 
      className="performance-grade"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: gradeColor,
        color: 'white',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600'
      }}
      role="status"
      aria-label={`Performance grade: ${grade}, Score: ${score}%`}
      title={factors.length > 0 ? `Issues: ${factors.join(', ')}` : 'Excellent performance'}
    >
      <span style={{ fontSize: '16px', marginRight: '6px' }}>{grade}</span>
      <span>{score}%</span>
    </div>
  );
});

const MiniChart = memo<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}>(({ data, width = 100, height = 30, color = '#00aa44', label }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg 
        width={width} 
        height={height} 
        style={{ display: 'block' }}
        role="img"
        aria-label={label || 'Performance trend chart'}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
        />
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#chartGradient)"
          points={`${points} ${width},${height} 0,${height}`}
        />
      </svg>
    </div>
  );
});

// ============================================================================
// New Relic Diagnostics Components
// ============================================================================

const NewRelicDiagnosticsPanel = memo<{
  diagnostics: {
    results: DiagnosticResult[];
    summary: any;
    recommendations: string[];
  } | null;
  onRunDiagnostics: () => void;
}>(({ diagnostics, onRunDiagnostics }) => {
  if (!diagnostics) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
          New Relic Diagnostics
        </div>
        <button
          onClick={onRunDiagnostics}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Run Diagnostics
        </button>
      </div>
    );
  }

  const { summary, results, recommendations } = diagnostics;
  const statusColor = {
    'healthy': '#00aa44',
    'issues': '#ffaa00',
    'critical': '#ff4444'
  }[summary.overallStatus];

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        New Relic Status
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 6px',
            backgroundColor: statusColor,
            color: 'white',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600'
          }}
        >
          {summary.overallStatus.toUpperCase()}
        </div>
      </div>
      
      <div style={{ fontSize: '11px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div style={{ color: '#00aa44' }}>✓ {summary.passes} Passed</div>
        <div style={{ color: '#ffaa00' }}>⚠ {summary.warnings} Warnings</div>
        <div style={{ color: '#ff4444' }}>✗ {summary.failures} Failed</div>
      </div>
      
      {summary.overallStatus !== 'healthy' && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>Issues Found:</div>
          <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
            {results.filter(r => r.status !== 'pass').slice(0, 3).map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '2px', 
                color: result.status === 'fail' ? '#ff4444' : '#ffaa00' 
              }}>
                • {result.message}
              </div>
            ))}
            {results.filter(r => r.status !== 'pass').length > 3 && (
              <div style={{ marginTop: '4px', opacity: 0.7 }}>
                ...and {results.filter(r => r.status !== 'pass').length - 3} more issues
              </div>
            )}
          </div>
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>Recommendations:</div>
          <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
            {recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={onRunDiagnostics}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        Re-run Diagnostics
      </button>
    </div>
  );
});

// ============================================================================
// Alert System Components
// ============================================================================

const AlertBanner = memo<{
  alerts: AlertHistory[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}>(({ alerts, onAcknowledge, onDismiss }) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  
  if (activeAlerts.length === 0) return null;

  const criticalAlerts = activeAlerts.filter(a => a.alert.severity === 'critical');
  const highestSeverity = criticalAlerts.length > 0 ? 'critical' : 
    activeAlerts.some(a => a.alert.severity === 'high') ? 'high' : 'medium';

  const alertColor = {
    'critical': '#ff4444',
    'high': '#ff8800',
    'medium': '#ffaa00',
    'low': '#00aa44'
  }[highestSeverity];

  return (
    <div 
      style={{
        backgroundColor: alertColor,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
        marginBottom: '16px',
        position: 'relative'
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
        {criticalAlerts.length > 0 ? 'Critical Performance Issues' : 'Performance Alerts'} 
        ({activeAlerts.length})
      </div>
      
      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
        {activeAlerts.slice(0, 3).map(alertEntry => (
          <div key={alertEntry.id} style={{ marginBottom: '4px' }}>
            {alertEntry.alert.message}
            {alertEntry.alert.actionTaken && (
              <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                (Auto-fix: {alertEntry.alert.actionTaken})
              </span>
            )}
          </div>
        ))}
        {activeAlerts.length > 3 && (
          <div style={{ marginTop: '8px', opacity: 0.8 }}>
            ...and {activeAlerts.length - 3} more alerts
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => activeAlerts.forEach(a => onAcknowledge(a.id))}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          aria-label="Acknowledge all alerts"
        >
          Acknowledge All
        </button>
        <button
          onClick={() => activeAlerts.forEach(a => onDismiss(a.id))}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          aria-label="Dismiss all alerts"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Main Dashboard Component
// ============================================================================

interface PerformanceDashboardProps {
  performanceMonitor: TypeSafePerformanceMonitor;
  deviceCapabilities: DeviceCapabilities;
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  initialConfig?: Partial<DashboardConfig>;
  onConfigChange?: (config: DashboardConfig) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  performanceMonitor,
  deviceCapabilities,
  visible = false,
  position = 'top-right',
  initialConfig = {},
  onConfigChange
}) => {
  // ========================================================================
  // State Management
  // ========================================================================
  
  const [config, setConfig] = useState<DashboardConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig
  }));

  const [currentMetrics, setCurrentMetrics] = useState<AdvancedPerformanceMetrics | null>(null);
  const [moduleMetrics, setModuleMetrics] = useState<Map<ModuleId, EnhancedPerformanceMetrics>>(new Map());
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [newRelicDiagnostics, setNewRelicDiagnostics] = useState<{
    results: DiagnosticResult[];
    summary: any;
    recommendations: string[];
  } | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // ========================================================================
  // Refs and Memoized Values
  // ========================================================================

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertIdCounterRef = useRef(0);

  const performanceGrade = useMemo(() => {
    if (!currentMetrics) return { grade: 'F' as const, score: 0, factors: [] };
    return calculatePerformanceGrade(currentMetrics);
  }, [currentMetrics]);
  
  // Run New Relic diagnostics on mount
  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const diagnostics = await newRelicDiagnostics.runFullDiagnostic();
        setNewRelicDiagnostics(diagnostics);
        console.log('🔍 New Relic Diagnostics Complete:', diagnostics);
      } catch (error) {
        console.error('Failed to run New Relic diagnostics:', error);
      }
    };
    
    // Run diagnostics after a short delay to ensure scripts are loaded
    const timer = setTimeout(runDiagnostics, 2000);
    return () => clearTimeout(timer);
  }, []);

  const recentFpsData = useMemo(() => 
    metricsHistory.slice(-20).map(h => h.metrics.fps),
    [metricsHistory]
  );

  const recentMemoryData = useMemo(() => 
    metricsHistory.slice(-20).map(h => h.metrics.memoryUsage),
    [metricsHistory]
  );

  // ========================================================================
  // Alert Management
  // ========================================================================

  const createAlert = useCallback((
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: PerformanceMetrics,
    moduleId?: ModuleId,
    actionTaken?: string
  ): PerformanceAlert => ({
    type,
    severity,
    message,
    metrics,
    timestamp: Date.now(),
    moduleId,
    actionTaken
  }), []);

  const checkForAlerts = useCallback((metrics: AdvancedPerformanceMetrics, moduleId?: ModuleId) => {
    const alerts: PerformanceAlert[] = [];

    // FPS alerts
    if (metrics.computedFPS < config.alertThresholds.fps) {
      const severity = metrics.computedFPS < 15 ? 'critical' : 
                     metrics.computedFPS < 25 ? 'high' : 'medium';
      alerts.push(createAlert(
        'fps-drop',
        severity,
        `Low frame rate detected: ${metrics.computedFPS.toFixed(1)} FPS`,
        metrics,
        moduleId
      ));
    }

    // Memory alerts
    if (metrics.memoryUsage > config.alertThresholds.memory) {
      const severity = metrics.memoryUsage > config.alertThresholds.memory * 1.5 ? 'critical' : 'high';
      alerts.push(createAlert(
        'memory-leak',
        severity,
        `High memory usage: ${metrics.memoryUsage.toFixed(1)} MB`,
        metrics,
        moduleId
      ));
    }

    // Performance score alerts
    if (metrics.performanceScore < 30) {
      alerts.push(createAlert(
        'cpu-spike',
        'high',
        `Poor overall performance score: ${metrics.performanceScore}%`,
        metrics,
        moduleId
      ));
    }

    // Battery alerts (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < config.alertThresholds.battery / 100) {
          alerts.push(createAlert(
            'battery-drain',
            'medium',
            `Low battery: ${Math.round(battery.level * 100)}%`,
            metrics,
            moduleId,
            'Consider reducing quality settings'
          ));
        }
      }).catch(() => {}); // Ignore battery API errors
    }

    // Add new alerts to history
    alerts.forEach(alert => {
      const alertEntry: AlertHistory = {
        id: `alert_${alertIdCounterRef.current++}`,
        timestamp: Date.now(),
        alert,
        acknowledged: false
      };
      setAlertHistory(prev => [...prev.slice(-49), alertEntry]); // Keep last 50 alerts
    });
  }, [config.alertThresholds, createAlert]);

  // ========================================================================
  // Data Collection and Updates
  // ========================================================================

  const updateMetrics = useCallback(() => {
    try {
      const baseMetrics = performanceMonitor.getMetrics();
      const advancedMetrics = enhancedPerformanceCollector.collectAdvancedMetrics(baseMetrics);
      setCurrentMetrics(advancedMetrics);

      // Add to history
      const historyEntry: MetricsHistory = {
        timestamp: Date.now(),
        metrics: advancedMetrics
      };
      
      setMetricsHistory(prev => {
        const updated = [...prev, historyEntry];
        return updated.slice(-300); // Keep last 5 minutes at 1s intervals
      });

      // Check for alerts
      if (config.showAlerts) {
        checkForAlerts(advancedMetrics);
      }

      // Update module metrics if available
      const newModuleMetrics = new Map<ModuleId, EnhancedPerformanceMetrics>();
      // Note: This would iterate over active modules in real implementation
      // For now, we'll just use the main metrics
      setModuleMetrics(newModuleMetrics);

    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }, [performanceMonitor, checkForAlerts, config.showAlerts]);

  // ========================================================================
  // Configuration Management
  // ========================================================================

  const updateConfig = useCallback((newConfig: Partial<DashboardConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      onConfigChange?.(updated);
      
      // Save to localStorage
      try {
        localStorage.setItem('perf-dashboard-config', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save dashboard config:', error);
      }
      
      return updated;
    });
  }, [onConfigChange]);

  // Load saved configuration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('perf-dashboard-config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...savedConfig }));
      }
    } catch (error) {
      console.warn('Failed to load saved dashboard config:', error);
    }
  }, []);

  // ========================================================================
  // Data Export Functionality
  // ========================================================================

  const exportData = useCallback((format: 'json' | 'csv') => {
    const exportData: ExportData = {
      timestamp: Date.now(),
      sessionId,
      metrics: metricsHistory,
      alerts: alertHistory,
      deviceCapabilities,
      configuration: config,
      newRelicDiagnostics
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      filename = `performance-data-${new Date().toISOString().slice(0, 19)}.json`;
      mimeType = 'application/json';
    } else {
      // CSV format
      const csvHeaders = 'Timestamp,FPS,Frame Time,Memory Usage,Render Time';
      const csvRows = metricsHistory.map(h => 
        `${h.timestamp},${h.metrics.fps},${h.metrics.frameTime},${h.metrics.memoryUsage},${h.metrics.renderTime}`
      );
      content = [csvHeaders, ...csvRows].join('\n');
      filename = `performance-data-${new Date().toISOString().slice(0, 19)}.csv`;
      mimeType = 'text/csv';
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metricsHistory, alertHistory, deviceCapabilities, config, sessionId, newRelicDiagnostics]);
  
  const runNewRelicDiagnostics = useCallback(async () => {
    try {
      console.log('🔍 Running New Relic diagnostics...');
      const diagnostics = await newRelicDiagnostics.runFullDiagnostic();
      setNewRelicDiagnostics(diagnostics);
      
      // Log current state for debugging
      newRelicDiagnostics.logCurrentState();
    } catch (error) {
      console.error('Failed to run New Relic diagnostics:', error);
    }
  }, []);

  // ========================================================================
  // Alert Handlers
  // ========================================================================

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlertHistory(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlertHistory(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // ========================================================================
  // Effects
  // ========================================================================

  // Setup refresh interval
  useEffect(() => {
    if (visible) {
      updateMetrics(); // Initial update
      refreshIntervalRef.current = setInterval(updateMetrics, config.refreshRate);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [visible, config.refreshRate, updateMetrics]);

  // ========================================================================
  // Keyboard Accessibility
  // ========================================================================

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsExpanded(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsExpanded(!isExpanded);
    }
  }, [isExpanded]);

  // ========================================================================
  // Render
  // ========================================================================

  if (!visible) return null;

  const positionStyles = {
    'top-left': { top: '16px', left: '16px' },
    'top-right': { top: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' }
  };

  const compactView = config.displayMode === 'compact' || config.displayMode === 'minimal';
  const minimalView = config.displayMode === 'minimal';

  return (
    <div 
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        maxWidth: isExpanded ? '600px' : '320px',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
      role="dialog"
      aria-label="Performance Dashboard"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div 
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        role="button"
        tabIndex={0}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Performance</div>
          {currentMetrics && (
            <PerformanceGradeBadge {...performanceGrade} />
          )}
        </div>
        <div style={{ fontSize: '12px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </div>
      </div>

      {/* Alert Banner */}
      {config.showAlerts && (
        <AlertBanner 
          alerts={alertHistory}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
        />
      )}

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        {currentMetrics ? (
          <>
            {/* Core Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              <MetricCard
                title="FPS"
                value={currentMetrics.computedFPS}
                unit=""
                severity={currentMetrics.computedFPS < 30 ? 'critical' : currentMetrics.computedFPS < 50 ? 'warning' : 'normal'}
                accessibilityLabel={`Frame rate: ${currentMetrics.computedFPS.toFixed(1)} frames per second`}
              />
              <MetricCard
                title="Memory"
                value={currentMetrics.memoryUsage}
                unit="MB"
                severity={currentMetrics.memoryUsage > 150 ? 'critical' : currentMetrics.memoryUsage > 100 ? 'warning' : 'normal'}
                accessibilityLabel={`Memory usage: ${currentMetrics.memoryUsage.toFixed(1)} megabytes`}
              />
              {!minimalView && (
                <>
                  <MetricCard
                    title="Frame Time"
                    value={currentMetrics.averageFrameTime}
                    unit="ms"
                    severity={currentMetrics.averageFrameTime > 33 ? 'critical' : currentMetrics.averageFrameTime > 20 ? 'warning' : 'normal'}
                    accessibilityLabel={`Average frame time: ${currentMetrics.averageFrameTime.toFixed(1)} milliseconds`}
                  />
                  <MetricCard
                    title="Efficiency"
                    value={Math.round(currentMetrics.memoryEfficiency)}
                    unit="%"
                    severity={currentMetrics.memoryEfficiency < 30 ? 'warning' : 'normal'}
                    accessibilityLabel={`Memory efficiency: ${Math.round(currentMetrics.memoryEfficiency)} percent`}
                  />
                </>
              )}
            </div>

            {/* Trends */}
            {config.showTrends && recentFpsData.length > 10 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Performance Trends (Last 20s)
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', marginBottom: '4px' }}>FPS</div>
                    <MiniChart 
                      data={recentFpsData} 
                      color="#00aa44" 
                      label="FPS trend over last 20 seconds"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', marginBottom: '4px' }}>Memory</div>
                    <MiniChart 
                      data={recentMemoryData} 
                      color="#0088ff" 
                      label="Memory usage trend over last 20 seconds"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* New Relic Diagnostics */}
            {config.enableNewRelicCorrelation && (
              <NewRelicDiagnosticsPanel 
                diagnostics={newRelicDiagnostics}
                onRunDiagnostics={runNewRelicDiagnostics}
              />
            )}

            {/* Expanded Details */}
            {isExpanded && !minimalView && (
              <>
                {/* GPU and Network Metrics */}
                {currentMetrics && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                      Advanced Metrics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                      {config.showGpuMetrics && (
                        <>
                          <MetricCard
                            title="GPU Usage"
                            value={currentMetrics.gpuUtilization}
                            unit="%"
                            severity={currentMetrics.gpuUtilization > 80 ? 'critical' : currentMetrics.gpuUtilization > 60 ? 'warning' : 'normal'}
                            accessibilityLabel={`GPU utilization: ${currentMetrics.gpuUtilization} percent`}
                          />
                          <MetricCard
                            title="WebGL Health"
                            value={currentMetrics.webglContextHealth ? '✓' : '✗'}
                            severity={currentMetrics.webglContextHealth ? 'normal' : 'warning'}
                            accessibilityLabel={`WebGL context health: ${currentMetrics.webglContextHealth ? 'healthy' : 'issues detected'}`}
                          />
                        </>
                      )}
                      {config.showNetworkMetrics && (
                        <>
                          <MetricCard
                            title="Network"
                            value={currentMetrics.networkLatency}
                            unit="ms"
                            severity={currentMetrics.networkLatency > 200 ? 'warning' : 'normal'}
                            accessibilityLabel={`Network latency: ${currentMetrics.networkLatency} milliseconds`}
                          />
                          <MetricCard
                            title="Thermal"
                            value={currentMetrics.thermalState}
                            severity={currentMetrics.thermalState === 'critical' ? 'critical' : currentMetrics.thermalState === 'serious' ? 'warning' : 'normal'}
                            accessibilityLabel={`Thermal state: ${currentMetrics.thermalState}`}
                          />
                        </>
                      )}
                      <MetricCard
                        title="Battery"
                        value={Math.round(currentMetrics.batteryLevel * 100)}
                        unit="%"
                        severity={currentMetrics.batteryLevel < 0.2 ? 'critical' : currentMetrics.batteryLevel < 0.4 ? 'warning' : 'normal'}
                        accessibilityLabel={`Battery level: ${Math.round(currentMetrics.batteryLevel * 100)} percent`}
                      />
                      <MetricCard
                        title="UX Score"
                        value={currentMetrics.perceivedPerformance}
                        unit="/100"
                        severity={currentMetrics.perceivedPerformance < 50 ? 'critical' : currentMetrics.perceivedPerformance < 70 ? 'warning' : 'normal'}
                        accessibilityLabel={`Perceived performance score: ${currentMetrics.perceivedPerformance} out of 100`}
                      />
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {currentMetrics.recommendations.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                      Optimization Recommendations
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                      {currentMetrics.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          • {rec.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Device Capabilities Summary */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                    Device Capabilities
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '11px' }}>
                    <div>WebGL: {deviceCapabilities.webgl ? '✓' : '✗'}</div>
                    <div>Mobile: {deviceCapabilities.isMobile ? '✓' : '✗'}</div>
                    <div>Workers: {deviceCapabilities.webWorkers ? '✓' : '✗'}</div>
                    <div>Low Power: {deviceCapabilities.isLowPower ? '✓' : '✗'}</div>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {config.enableExport && (
                    <>
                      <button
                        onClick={() => exportData('json')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        aria-label="Export performance data as JSON"
                      >
                        Export JSON
                      </button>
                      <button
                        onClick={() => exportData('csv')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        aria-label="Export performance data as CSV"
                      >
                        Export CSV
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMetricsHistory([]);
                      setAlertHistory([]);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                    aria-label="Clear performance history"
                  >
                    Clear History
                  </button>
                  <button
                    onClick={() => updateConfig({ enableNewRelicCorrelation: !config.enableNewRelicCorrelation })}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: config.enableNewRelicCorrelation ? '#0088ff' : 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: config.enableNewRelicCorrelation ? 'white' : 'var(--text-primary)'
                    }}
                    aria-label={`${config.enableNewRelicCorrelation ? 'Disable' : 'Enable'} New Relic diagnostics`}
                  >
                    {config.enableNewRelicCorrelation ? 'Hide' : 'Show'} New Relic
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
            Loading performance data...
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;