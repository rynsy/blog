/**
 * Intelligent Alerting System
 * 
 * Advanced performance alerting with machine learning-inspired pattern recognition,
 * adaptive thresholds, predictive alerts, and user-friendly notifications.
 * 
 * Features:
 * - Adaptive threshold adjustment based on usage patterns
 * - Predictive alerting before critical issues occur
 * - Alert fatigue prevention with intelligent deduplication
 * - Context-aware alerts based on current module and user activity
 * - Accessibility-compliant notifications
 * - Privacy-respecting local analysis
 */

import {
  PerformanceMetrics,
  PerformanceAlert,
  DeviceCapabilities
} from '@/interfaces/BackgroundSystemV3';
import {
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  ModuleId
} from '@/types/utilities';

// ============================================================================
// Alert System Types and Interfaces
// ============================================================================

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  category: AlertCategory;
  enabled: boolean;
  adaptive: boolean;
  cooldownMs: number;
  maxAlerts: number;
  timeWindowMs: number;
}

interface AlertCondition {
  type: 'threshold' | 'trend' | 'pattern' | 'anomaly' | 'composite';
  metric: keyof EnhancedPerformanceMetrics | 'custom';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change' | 'pattern';
  value: number | string | number[];
  duration?: number; // ms
  confidence?: number; // 0-1
}

interface AlertConfiguration {
  rules: AlertRule[];
  globalSettings: {
    enablePredictiveAlerts: boolean;
    enableAdaptiveThresholds: boolean;
    alertFatiguePrevention: boolean;
    respectAccessibilitySettings: boolean;
    maxConcurrentAlerts: number;
    defaultCooldown: number;
    notificationDuration: number;
  };
  thresholds: {
    [key: string]: {
      warning: number;
      critical: number;
      adaptive: boolean;
      baseline?: number;
      variance?: number;
    };
  };
}

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
type AlertCategory = 'performance' | 'memory' | 'battery' | 'thermal' | 'network' | 'interaction' | 'gpu' | 'accessibility';

interface AlertEvent {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  context: AlertContext;
  recommendations: PerformanceRecommendation[];
  acknowledged: boolean;
  dismissed: boolean;
  autoResolved: boolean;
  metadata: Record<string, unknown>;
}

interface AlertContext {
  moduleId?: ModuleId;
  metrics: EnhancedPerformanceMetrics;
  deviceCapabilities: DeviceCapabilities;
  userActivity: 'active' | 'idle' | 'background';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration: number; // ms
  batteryLevel?: number;
  networkCondition?: 'fast' | 'slow' | 'offline';
}

interface AlertHistory {
  events: AlertEvent[];
  patterns: AlertPattern[];
  suppressions: AlertSuppression[];
  adaptiveThresholds: Map<string, AdaptiveThreshold>;
}

interface AlertPattern {
  id: string;
  type: 'recurring' | 'cascade' | 'spike' | 'drift';
  events: string[]; // Alert event IDs
  frequency: number;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  prediction?: {
    nextOccurrence?: number;
    probability: number;
  };
}

interface AlertSuppression {
  id: string;
  ruleId: string;
  reason: 'user-dismissed' | 'auto-resolved' | 'fatigue-prevention' | 'maintenance-mode';
  suppressUntil: number;
  conditions?: Record<string, unknown>;
}

interface AdaptiveThreshold {
  metric: string;
  current: number;
  baseline: number;
  variance: number;
  samples: number[];
  lastUpdate: number;
  learningRate: number;
}

interface AlertNotification {
  id: string;
  alert: AlertEvent;
  displayMode: 'banner' | 'toast' | 'modal' | 'sound' | 'vibration';
  duration: number;
  persistent: boolean;
  accessibilityFeatures: {
    screenReader: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    sound: boolean;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ALERT_CONFIG: AlertConfiguration = {
  rules: [
    {
      id: 'fps-critical',
      name: 'Critical FPS Drop',
      description: 'Frame rate has dropped below critical threshold',
      condition: {
        type: 'threshold',
        metric: 'computedFPS',
        operator: 'lt',
        value: 15,
        duration: 3000 // 3 seconds
      },
      severity: 'critical',
      category: 'performance',
      enabled: true,
      adaptive: true,
      cooldownMs: 10000,
      maxAlerts: 3,
      timeWindowMs: 60000
    },
    {
      id: 'memory-warning',
      name: 'High Memory Usage',
      description: 'Memory usage is approaching system limits',
      condition: {
        type: 'threshold',
        metric: 'memoryUsage',
        operator: 'gt',
        value: 150,
        duration: 5000
      },
      severity: 'warning',
      category: 'memory',
      enabled: true,
      adaptive: true,
      cooldownMs: 15000,
      maxAlerts: 2,
      timeWindowMs: 120000
    },
    {
      id: 'battery-drain',
      name: 'High Battery Drain',
      description: 'Battery is draining faster than expected',
      condition: {
        type: 'trend',
        metric: 'batteryLevel',
        operator: 'change',
        value: -0.1, // 10% drop
        duration: 600000 // 10 minutes
      },
      severity: 'warning',
      category: 'battery',
      enabled: true,
      adaptive: false,
      cooldownMs: 30000,
      maxAlerts: 1,
      timeWindowMs: 300000
    },
    {
      id: 'thermal-throttling',
      name: 'Thermal Throttling Detected',
      description: 'Device is throttling performance due to heat',
      condition: {
        type: 'pattern',
        metric: 'thermalState',
        operator: 'eq',
        value: 'serious'
      },
      severity: 'error',
      category: 'thermal',
      enabled: true,
      adaptive: false,
      cooldownMs: 20000,
      maxAlerts: 2,
      timeWindowMs: 180000
    },
    {
      id: 'interaction-latency',
      name: 'High Input Latency',
      description: 'User interactions are responding slowly',
      condition: {
        type: 'threshold',
        metric: 'inputLatency',
        operator: 'gt',
        value: 100,
        duration: 2000
      },
      severity: 'warning',
      category: 'interaction',
      enabled: true,
      adaptive: true,
      cooldownMs: 10000,
      maxAlerts: 3,
      timeWindowMs: 60000
    },
    {
      id: 'memory-leak-prediction',
      name: 'Potential Memory Leak',
      description: 'Memory usage trend suggests a possible leak',
      condition: {
        type: 'trend',
        metric: 'memoryUsage',
        operator: 'change',
        value: 50, // 50MB increase
        duration: 300000 // 5 minutes
      },
      severity: 'warning',
      category: 'memory',
      enabled: true,
      adaptive: false,
      cooldownMs: 60000,
      maxAlerts: 1,
      timeWindowMs: 900000
    }
  ],
  globalSettings: {
    enablePredictiveAlerts: true,
    enableAdaptiveThresholds: true,
    alertFatiguePrevention: true,
    respectAccessibilitySettings: true,
    maxConcurrentAlerts: 3,
    defaultCooldown: 15000,
    notificationDuration: 8000
  },
  thresholds: {
    fps: { warning: 30, critical: 15, adaptive: true },
    memoryUsage: { warning: 100, critical: 200, adaptive: true },
    frameTime: { warning: 33, critical: 66, adaptive: true },
    inputLatency: { warning: 50, critical: 150, adaptive: true },
    batteryLevel: { warning: 0.2, critical: 0.1, adaptive: false }
  }
};

// ============================================================================
// Adaptive Threshold Manager
// ============================================================================

class AdaptiveThresholdManager {
  private thresholds = new Map<string, AdaptiveThreshold>();
  private readonly learningRate = 0.1;
  private readonly minSamples = 10;
  private readonly maxSamples = 100;

  updateThreshold(metric: string, value: number, config: AlertConfiguration): void {
    let threshold = this.thresholds.get(metric);
    
    if (!threshold) {
      const baseConfig = config.thresholds[metric];
      if (!baseConfig?.adaptive) return;
      
      threshold = {
        metric,
        current: baseConfig.warning,
        baseline: value,
        variance: 0,
        samples: [value],
        lastUpdate: Date.now(),
        learningRate: this.learningRate
      };
      this.thresholds.set(metric, threshold);
      return;
    }

    // Add new sample
    threshold.samples.push(value);
    if (threshold.samples.length > this.maxSamples) {
      threshold.samples = threshold.samples.slice(-this.maxSamples);
    }

    // Update statistics if we have enough samples
    if (threshold.samples.length >= this.minSamples) {
      const mean = threshold.samples.reduce((a, b) => a + b, 0) / threshold.samples.length;
      const variance = threshold.samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / threshold.samples.length;
      
      // Update baseline with exponential moving average
      threshold.baseline = threshold.baseline * (1 - threshold.learningRate) + mean * threshold.learningRate;
      threshold.variance = Math.sqrt(variance);
      
      // Adjust threshold based on variance
      const baseConfig = config.thresholds[metric];
      if (baseConfig) {
        // Set threshold at 2 standard deviations above baseline for warnings
        threshold.current = Math.max(
          baseConfig.warning,
          threshold.baseline + (2 * threshold.variance)
        );
      }
      
      threshold.lastUpdate = Date.now();
    }
  }

  getAdaptiveThreshold(metric: string, severity: 'warning' | 'critical' = 'warning'): number | null {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return null;
    
    if (severity === 'critical') {
      // Critical threshold is typically 1.5x the warning threshold
      return threshold.current * 1.5;
    }
    
    return threshold.current;
  }

  getAllThresholds(): Map<string, AdaptiveThreshold> {
    return new Map(this.thresholds);
  }

  reset(metric?: string): void {
    if (metric) {
      this.thresholds.delete(metric);
    } else {
      this.thresholds.clear();
    }
  }
}

// ============================================================================
// Pattern Recognition Engine
// ============================================================================

class AlertPatternRecognition {
  private patterns = new Map<string, AlertPattern>();
  private readonly minEventsForPattern = 3;
  private readonly patternConfidenceThreshold = 0.7;

  analyzeEvents(events: AlertEvent[]): AlertPattern[] {
    const newPatterns: AlertPattern[] = [];
    
    // Group events by rule ID and analyze for patterns
    const eventsByRule = this.groupEventsByRule(events);
    
    for (const [ruleId, ruleEvents] of eventsByRule) {
      if (ruleEvents.length < this.minEventsForPattern) continue;
      
      // Analyze for recurring patterns
      const recurringPattern = this.detectRecurringPattern(ruleId, ruleEvents);
      if (recurringPattern) {
        newPatterns.push(recurringPattern);
        this.patterns.set(recurringPattern.id, recurringPattern);
      }
      
      // Analyze for cascading patterns
      const cascadePattern = this.detectCascadePattern(ruleId, ruleEvents, events);
      if (cascadePattern) {
        newPatterns.push(cascadePattern);
        this.patterns.set(cascadePattern.id, cascadePattern);
      }
    }
    
    return newPatterns;
  }

  private groupEventsByRule(events: AlertEvent[]): Map<string, AlertEvent[]> {
    const groups = new Map<string, AlertEvent[]>();
    
    events.forEach(event => {
      const existing = groups.get(event.ruleId) || [];
      existing.push(event);
      groups.set(event.ruleId, existing);
    });
    
    return groups;
  }

  private detectRecurringPattern(ruleId: string, events: AlertEvent[]): AlertPattern | null {
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate intervals between consecutive events
    const intervals: number[] = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      intervals.push(sortedEvents[i].timestamp - sortedEvents[i-1].timestamp);
    }
    
    if (intervals.length < 2) return null;
    
    // Check for consistent intervals (within 20% variance)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgInterval;
    
    if (coefficientOfVariation < 0.2) { // Low variance indicates recurring pattern
      const confidence = Math.max(0, 1 - coefficientOfVariation);
      
      if (confidence >= this.patternConfidenceThreshold) {
        return {
          id: `recurring_${ruleId}_${Date.now()}`,
          type: 'recurring',
          events: sortedEvents.map(e => e.id),
          frequency: avgInterval,
          confidence,
          impact: this.calculatePatternImpact(sortedEvents),
          prediction: {
            nextOccurrence: sortedEvents[sortedEvents.length - 1].timestamp + avgInterval,
            probability: confidence
          }
        };
      }
    }
    
    return null;
  }

  private detectCascadePattern(ruleId: string, events: AlertEvent[], allEvents: AlertEvent[]): AlertPattern | null {
    // Look for other alert types that occur shortly after this rule's events
    const cascadeWindow = 30000; // 30 seconds
    const cascadeEvents: string[] = [];
    
    events.forEach(event => {
      const relatedEvents = allEvents.filter(e => 
        e.ruleId !== ruleId &&
        e.timestamp > event.timestamp &&
        e.timestamp <= event.timestamp + cascadeWindow
      );
      
      cascadeEvents.push(...relatedEvents.map(e => e.id));
    });
    
    if (cascadeEvents.length >= this.minEventsForPattern) {
      return {
        id: `cascade_${ruleId}_${Date.now()}`,
        type: 'cascade',
        events: [...events.map(e => e.id), ...cascadeEvents],
        frequency: 0, // Not applicable for cascade patterns
        confidence: Math.min(0.9, cascadeEvents.length / events.length),
        impact: 'high'
      };
    }
    
    return null;
  }

  private calculatePatternImpact(events: AlertEvent[]): 'low' | 'medium' | 'high' {
    const criticalCount = events.filter(e => e.severity === 'critical').length;
    const errorCount = events.filter(e => e.severity === 'error').length;
    
    if (criticalCount > 0 || errorCount > 2) return 'high';
    if (errorCount > 0 || events.length > 5) return 'medium';
    return 'low';
  }

  predictNextAlert(ruleId: string): { timestamp: number; probability: number } | null {
    const patterns = Array.from(this.patterns.values()).filter(p => 
      p.type === 'recurring' && 
      p.events.some(eventId => eventId.includes(ruleId)) // Simplified check
    );
    
    if (patterns.length === 0) return null;
    
    // Use the most confident pattern for prediction
    const bestPattern = patterns.reduce((best, pattern) => 
      pattern.confidence > best.confidence ? pattern : best
    );
    
    return bestPattern.prediction || null;
  }

  getPatterns(): AlertPattern[] {
    return Array.from(this.patterns.values());
  }

  clearPatterns(): void {
    this.patterns.clear();
  }
}

// ============================================================================
// Alert Fatigue Prevention
// ============================================================================

class AlertFatiguePrevention {
  private suppressions = new Map<string, AlertSuppression>();
  private alertCounts = new Map<string, { count: number; firstAlert: number; lastAlert: number }>();
  
  shouldSuppressAlert(rule: AlertRule, recentEvents: AlertEvent[]): boolean {
    const suppression = this.suppressions.get(rule.id);
    if (suppression && Date.now() < suppression.suppressUntil) {
      return true;
    }
    
    // Check alert frequency
    const ruleEvents = recentEvents.filter(e => e.ruleId === rule.id);
    const timeWindow = rule.timeWindowMs || 60000;
    const cutoff = Date.now() - timeWindow;
    const recentRuleEvents = ruleEvents.filter(e => e.timestamp > cutoff);
    
    if (recentRuleEvents.length >= rule.maxAlerts) {
      // Create temporary suppression
      this.suppressions.set(rule.id, {
        id: `temp_${rule.id}_${Date.now()}`,
        ruleId: rule.id,
        reason: 'fatigue-prevention',
        suppressUntil: Date.now() + (rule.cooldownMs * 2)
      });
      return true;
    }
    
    return false;
  }

  recordDismissal(alertId: string, ruleId: string): void {
    const alertCount = this.alertCounts.get(ruleId) || { count: 0, firstAlert: 0, lastAlert: 0 };
    alertCount.count++;
    alertCount.lastAlert = Date.now();
    
    if (alertCount.firstAlert === 0) {
      alertCount.firstAlert = Date.now();
    }
    
    this.alertCounts.set(ruleId, alertCount);
    
    // If user dismisses the same alert type repeatedly, increase suppression time
    if (alertCount.count >= 3) {
      const suppressionDuration = Math.min(3600000, alertCount.count * 300000); // Max 1 hour
      this.suppressions.set(ruleId, {
        id: `user_dismiss_${ruleId}_${Date.now()}`,
        ruleId,
        reason: 'user-dismissed',
        suppressUntil: Date.now() + suppressionDuration
      });
    }
  }

  clearSuppressions(ruleId?: string): void {
    if (ruleId) {
      this.suppressions.delete(ruleId);
      this.alertCounts.delete(ruleId);
    } else {
      this.suppressions.clear();
      this.alertCounts.clear();
    }
  }

  getActiveSuppressions(): AlertSuppression[] {
    const now = Date.now();
    return Array.from(this.suppressions.values()).filter(s => s.suppressUntil > now);
  }
}

// ============================================================================
// Main Intelligent Alerting System
// ============================================================================

export class IntelligentAlertingSystem {
  private config: AlertConfiguration;
  private history: AlertHistory;
  private adaptiveThresholds: AdaptiveThresholdManager;
  private patternRecognition: AlertPatternRecognition;
  private fatiguePrevention: AlertFatiguePrevention;
  private notificationQueue: AlertNotification[];
  private activeAlerts: Map<string, AlertEvent>;
  
  private isInitialized = false;
  private alertIdCounter = 0;

  constructor(config: Partial<AlertConfiguration> = {}) {
    this.config = this.mergeConfig(config);
    this.history = {
      events: [],
      patterns: [],
      suppressions: [],
      adaptiveThresholds: new Map()
    };
    
    this.adaptiveThresholds = new AdaptiveThresholdManager();
    this.patternRecognition = new AlertPatternRecognition();
    this.fatiguePrevention = new AlertFatiguePrevention();
    this.notificationQueue = [];
    this.activeAlerts = new Map();
  }

  private mergeConfig(userConfig: Partial<AlertConfiguration>): AlertConfiguration {
    const merged = JSON.parse(JSON.stringify(DEFAULT_ALERT_CONFIG));
    
    if (userConfig.rules) {
      // Merge rules by ID
      userConfig.rules.forEach(userRule => {
        const existingIndex = merged.rules.findIndex(r => r.id === userRule.id);
        if (existingIndex >= 0) {
          merged.rules[existingIndex] = { ...merged.rules[existingIndex], ...userRule };
        } else {
          merged.rules.push(userRule);
        }
      });
    }
    
    if (userConfig.globalSettings) {
      Object.assign(merged.globalSettings, userConfig.globalSettings);
    }
    
    if (userConfig.thresholds) {
      Object.assign(merged.thresholds, userConfig.thresholds);
    }
    
    return merged;
  }

  initialize(): void {
    if (this.isInitialized) return;
    
    // Load saved configuration and history
    this.loadPersistedData();
    
    this.isInitialized = true;
  }

  private loadPersistedData(): void {
    try {
      const savedConfig = localStorage.getItem('alert-system-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = this.mergeConfig(parsed);
      }
      
      const savedHistory = localStorage.getItem('alert-system-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        this.history = { ...this.history, ...parsed };
        
        // Restore adaptive thresholds
        if (parsed.adaptiveThresholds) {
          parsed.adaptiveThresholds.forEach((threshold: AdaptiveThreshold, metric: string) => {
            this.adaptiveThresholds.updateThreshold(metric, threshold.baseline, this.config);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted alert system data:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('alert-system-config', JSON.stringify(this.config));
      
      const historyToSave = {
        ...this.history,
        events: this.history.events.slice(-100), // Keep only recent events
        adaptiveThresholds: Object.fromEntries(this.adaptiveThresholds.getAllThresholds())
      };
      localStorage.setItem('alert-system-history', JSON.stringify(historyToSave));
    } catch (error) {
      console.warn('Failed to persist alert system data:', error);
    }
  }

  analyzeMetrics(
    metrics: EnhancedPerformanceMetrics,
    context: Partial<AlertContext>
  ): AlertEvent[] {
    if (!this.isInitialized) this.initialize();
    
    const newAlerts: AlertEvent[] = [];
    const fullContext = this.buildFullContext(metrics, context);
    
    // Update adaptive thresholds
    if (this.config.globalSettings.enableAdaptiveThresholds) {
      this.updateAdaptiveThresholds(metrics);
    }
    
    // Evaluate each rule
    for (const rule of this.config.rules.filter(r => r.enabled)) {
      // Check if alert should be suppressed
      if (this.config.globalSettings.alertFatiguePrevention) {
        if (this.fatiguePrevention.shouldSuppressAlert(rule, this.history.events)) {
          continue;
        }
      }
      
      // Evaluate rule condition
      if (this.evaluateRuleCondition(rule, metrics, fullContext)) {
        const alert = this.createAlert(rule, metrics, fullContext);
        newAlerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
      }
    }
    
    // Add new alerts to history
    this.history.events.push(...newAlerts);
    
    // Analyze patterns if we have enough data
    if (this.history.events.length >= 10) {
      const newPatterns = this.patternRecognition.analyzeEvents(this.history.events);
      this.history.patterns.push(...newPatterns);
    }
    
    // Create notifications for new alerts
    newAlerts.forEach(alert => {
      const notification = this.createNotification(alert, fullContext);
      this.notificationQueue.push(notification);
    });
    
    // Persist data periodically
    if (this.history.events.length % 10 === 0) {
      this.persistData();
    }
    
    return newAlerts;
  }

  private buildFullContext(
    metrics: EnhancedPerformanceMetrics,
    partialContext: Partial<AlertContext>
  ): AlertContext {
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    return {
      metrics,
      deviceCapabilities: partialContext.deviceCapabilities || {} as DeviceCapabilities,
      userActivity: partialContext.userActivity || 'active',
      timeOfDay,
      sessionDuration: partialContext.sessionDuration || 0,
      batteryLevel: metrics.batteryLevel,
      networkCondition: partialContext.networkCondition || 'fast',
      ...partialContext
    };
  }

  private updateAdaptiveThresholds(metrics: EnhancedPerformanceMetrics): void {
    Object.keys(this.config.thresholds).forEach(metric => {
      const value = metrics[metric as keyof EnhancedPerformanceMetrics];
      if (typeof value === 'number') {
        this.adaptiveThresholds.updateThreshold(metric, value, this.config);
      }
    });
  }

  private evaluateRuleCondition(
    rule: AlertRule,
    metrics: EnhancedPerformanceMetrics,
    context: AlertContext
  ): boolean {
    const condition = rule.condition;
    let metricValue: number;
    
    if (condition.metric === 'custom') {
      // Handle custom metrics
      return false; // Would need custom evaluation logic
    }
    
    metricValue = metrics[condition.metric] as number;
    if (typeof metricValue !== 'number') return false;
    
    // Get threshold value (adaptive if enabled)
    let thresholdValue = condition.value as number;
    if (rule.adaptive && this.config.globalSettings.enableAdaptiveThresholds) {
      const adaptiveThreshold = this.adaptiveThresholds.getAdaptiveThreshold(
        condition.metric,
        rule.severity === 'critical' ? 'critical' : 'warning'
      );
      if (adaptiveThreshold !== null) {
        thresholdValue = adaptiveThreshold;
      }
    }
    
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition, metricValue, thresholdValue);
      
      case 'trend':
        return this.evaluateTrendCondition(condition, condition.metric, thresholdValue);
      
      case 'pattern':
        return this.evaluatePatternCondition(condition, metricValue, thresholdValue);
      
      case 'anomaly':
        return this.evaluateAnomalyCondition(condition.metric, metricValue);
      
      default:
        return false;
    }
  }

  private evaluateThresholdCondition(
    condition: AlertCondition,
    metricValue: number,
    thresholdValue: number
  ): boolean {
    switch (condition.operator) {
      case 'gt': return metricValue > thresholdValue;
      case 'gte': return metricValue >= thresholdValue;
      case 'lt': return metricValue < thresholdValue;
      case 'lte': return metricValue <= thresholdValue;
      case 'eq': return metricValue === thresholdValue;
      default: return false;
    }
  }

  private evaluateTrendCondition(
    condition: AlertCondition,
    metric: string,
    thresholdValue: number
  ): boolean {
    const recentEvents = this.history.events
      .filter(e => e.timestamp > Date.now() - (condition.duration || 60000))
      .filter(e => e.context.metrics[metric as keyof EnhancedPerformanceMetrics] !== undefined);
    
    if (recentEvents.length < 2) return false;
    
    const values = recentEvents.map(e => e.context.metrics[metric as keyof EnhancedPerformanceMetrics] as number);
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    
    return condition.operator === 'change' && Math.abs(change) > Math.abs(thresholdValue);
  }

  private evaluatePatternCondition(
    condition: AlertCondition,
    metricValue: number,
    thresholdValue: number
  ): boolean {
    // Simplified pattern matching - could be expanded
    return metricValue === thresholdValue;
  }

  private evaluateAnomalyCondition(metric: string, metricValue: number): boolean {
    const threshold = this.adaptiveThresholds.getAllThresholds().get(metric);
    if (!threshold) return false;
    
    // Consider value anomalous if it's more than 3 standard deviations from baseline
    const deviation = Math.abs(metricValue - threshold.baseline);
    return deviation > (3 * threshold.variance);
  }

  private createAlert(
    rule: AlertRule,
    metrics: EnhancedPerformanceMetrics,
    context: AlertContext
  ): AlertEvent {
    const alertId = `alert_${++this.alertIdCounter}_${Date.now()}`;
    
    return {
      id: alertId,
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      category: rule.category,
      title: rule.name,
      message: this.generateAlertMessage(rule, metrics, context),
      context,
      recommendations: this.generateRecommendations(rule, metrics, context),
      acknowledged: false,
      dismissed: false,
      autoResolved: false,
      metadata: {
        adaptiveThresholdUsed: rule.adaptive,
        predictedAlert: false // Would be set by predictive system
      }
    };
  }

  private generateAlertMessage(
    rule: AlertRule,
    metrics: EnhancedPerformanceMetrics,
    context: AlertContext
  ): string {
    const condition = rule.condition;
    const metricValue = metrics[condition.metric as keyof EnhancedPerformanceMetrics];
    
    let message = rule.description;
    
    // Add specific details
    if (condition.type === 'threshold') {
      message += ` Current value: ${typeof metricValue === 'number' ? metricValue.toFixed(1) : metricValue}, threshold: ${condition.value}`;
    }
    
    // Add context
    if (context.moduleId) {
      message += ` (Module: ${context.moduleId})`;
    }
    
    if (context.batteryLevel && context.batteryLevel < 0.3) {
      message += ' - Low battery may be affecting performance';
    }
    
    return message;
  }

  private generateRecommendations(
    rule: AlertRule,
    metrics: EnhancedPerformanceMetrics,
    context: AlertContext
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    switch (rule.category) {
      case 'performance':
        if (metrics.computedFPS < 30) {
          recommendations.push({
            type: 'quality',
            severity: 'warning',
            message: 'Consider reducing visual quality settings to improve frame rate'
          });
        }
        break;
        
      case 'memory':
        recommendations.push({
          type: 'memory',
          severity: 'info',
          message: 'Close unused browser tabs or applications to free up memory'
        });
        break;
        
      case 'battery':
        recommendations.push({
          type: 'quality',
          severity: 'info',
          message: 'Enable power saving mode to extend battery life'
        });
        break;
        
      case 'thermal':
        recommendations.push({
          type: 'quality',
          severity: 'warning',
          message: 'Reduce system load to prevent thermal throttling'
        });
        break;
    }
    
    return recommendations;
  }

  private createNotification(alert: AlertEvent, context: AlertContext): AlertNotification {
    const accessibilitySettings = this.detectAccessibilitySettings();
    
    return {
      id: `notification_${alert.id}`,
      alert,
      displayMode: alert.severity === 'critical' ? 'modal' : 'banner',
      duration: this.config.globalSettings.notificationDuration,
      persistent: alert.severity === 'critical',
      accessibilityFeatures: accessibilitySettings
    };
  }

  private detectAccessibilitySettings(): AlertNotification['accessibilityFeatures'] {
    return {
      screenReader: window.navigator.userAgent.includes('NVDA') || window.navigator.userAgent.includes('JAWS'),
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      sound: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }

  // ========================================================================
  // Public API Methods
  // ========================================================================

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      
      // Remove from notification queue
      this.notificationQueue = this.notificationQueue.filter(n => n.alert.id !== alertId);
    }
  }

  dismissAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.dismissed = true;
      this.fatiguePrevention.recordDismissal(alertId, alert.ruleId);
      this.activeAlerts.delete(alertId);
      
      // Remove from notification queue
      this.notificationQueue = this.notificationQueue.filter(n => n.alert.id !== alertId);
    }
  }

  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  getNotificationQueue(): AlertNotification[] {
    return [...this.notificationQueue];
  }

  clearNotificationQueue(): void {
    this.notificationQueue = [];
  }

  updateConfiguration(config: Partial<AlertConfiguration>): void {
    this.config = this.mergeConfig(config);
    this.persistData();
  }

  getConfiguration(): AlertConfiguration {
    return JSON.parse(JSON.stringify(this.config));
  }

  enableRule(ruleId: string): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
      this.persistData();
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
      this.persistData();
    }
  }

  getPredictiveAlerts(): Array<{ ruleId: string; prediction: { timestamp: number; probability: number } }> {
    if (!this.config.globalSettings.enablePredictiveAlerts) return [];
    
    const predictions: Array<{ ruleId: string; prediction: { timestamp: number; probability: number } }> = [];
    
    this.config.rules.forEach(rule => {
      const prediction = this.patternRecognition.predictNextAlert(rule.id);
      if (prediction && prediction.probability > 0.7) {
        predictions.push({ ruleId: rule.id, prediction });
      }
    });
    
    return predictions;
  }

  getAlertHistory(limit: number = 50): AlertEvent[] {
    return this.history.events.slice(-limit);
  }

  getAlertPatterns(): AlertPattern[] {
    return this.patternRecognition.getPatterns();
  }

  exportAlertData(): {
    events: AlertEvent[];
    patterns: AlertPattern[];
    configuration: AlertConfiguration;
    timestamp: number;
  } {
    return {
      events: this.history.events,
      patterns: this.history.patterns,
      configuration: this.config,
      timestamp: Date.now()
    };
  }

  cleanup(): void {
    this.persistData();
    this.activeAlerts.clear();
    this.notificationQueue = [];
    this.isInitialized = false;
  }
}

export default IntelligentAlertingSystem;