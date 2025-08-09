/**
 * Module Performance Analytics
 * 
 * Advanced per-module performance tracking with comparative analytics,
 * benchmarking, optimization recommendations, and performance regression detection.
 * 
 * Features:
 * - Individual module performance profiling
 * - Cross-module performance comparison
 * - Performance regression detection
 * - Module-specific optimization recommendations
 * - Resource usage attribution
 * - Performance impact scoring
 * - Module efficiency rankings
 * - Resource conflict detection
 */

import {
  PerformanceMetrics,
  MemoryStats,
  DeviceCapabilities,
  ModuleConfiguration
} from '@/interfaces/BackgroundSystemV3';
import {
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  ModuleId,
  PerformanceTimestamp,
  MemoryMB,
  createMemoryMB
} from '@/types/utilities';

// ============================================================================
// Module Analytics Types and Interfaces
// ============================================================================

interface ModulePerformanceProfile {
  moduleId: ModuleId;
  moduleName: string;
  category: string;
  version: string;
  
  // Performance characteristics
  averageMetrics: EnhancedPerformanceMetrics;
  peakMetrics: EnhancedPerformanceMetrics;
  baselineMetrics: EnhancedPerformanceMetrics;
  
  // Resource usage
  resourceUsage: ModuleResourceUsage;
  
  // Temporal analysis
  performanceHistory: PerformanceHistoryEntry[];
  performanceTrends: PerformanceTrends;
  
  // Comparative metrics
  relativePerformance: RelativePerformanceMetrics;
  
  // Configuration impact
  configurationImpact: ConfigurationImpactAnalysis;
  
  // Quality metrics
  stabilityMetrics: StabilityMetrics;
  userExperienceMetrics: UserExperienceMetrics;
  
  // Metadata
  firstSeen: number;
  lastActive: number;
  totalActiveTime: number;
  activationCount: number;
  
  // Analytics metadata
  analyticsVersion: string;
  lastAnalyzed: number;
}

interface ModuleResourceUsage {
  // Memory attribution
  heapMemory: MemoryAttribution;
  textureMemory: MemoryAttribution;
  bufferMemory: MemoryAttribution;
  
  // CPU usage
  renderCpu: number; // % during rendering
  updateCpu: number; // % during updates
  initializationCpu: number; // % during initialization
  
  // GPU resources
  shaderPrograms: number;
  textures: number;
  vertexBuffers: number;
  drawCalls: number;
  
  // Network resources
  assetsLoaded: number;
  totalAssetSize: number; // bytes
  networkRequests: number;
  
  // Storage resources
  localStorage: number; // bytes
  indexedDB: number; // bytes
  cacheUsage: number; // bytes
}

interface MemoryAttribution {
  allocated: MemoryMB;
  peak: MemoryMB;
  average: MemoryMB;
  growth: MemoryMB; // per minute
  leaks: number; // detected leak count
}

interface PerformanceHistoryEntry {
  timestamp: number;
  metrics: EnhancedPerformanceMetrics;
  configuration: ModuleConfiguration;
  context: {
    deviceLoad: number; // 0-1
    batteryLevel?: number;
    thermalState?: string;
    networkCondition?: string;
    timeOfDay: string;
  };
}

interface PerformanceTrends {
  fpstrend: TrendAnalysis;
  memoryTrend: TrendAnalysis;
  stabilityTrend: TrendAnalysis;
  efficiencyTrend: TrendAnalysis;
}

interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  rate: number; // units per day
  confidence: number; // 0-1
  significance: 'high' | 'medium' | 'low';
  projectedValue: number; // value in 7 days
}

interface RelativePerformanceMetrics {
  fpsRank: number; // 1 = best
  memoryRank: number;
  stabilityRank: number;
  overallRank: number;
  
  performanceScore: number; // 0-100
  efficiencyScore: number; // 0-100 (performance per resource unit)
  compatibilityScore: number; // 0-100 (works well with other modules)
  
  comparisons: ModuleComparison[];
}

interface ModuleComparison {
  comparedWith: ModuleId;
  category: 'similar' | 'alternative' | 'complementary';
  
  fpsComparison: ComparisonResult;
  memoryComparison: ComparisonResult;
  stabilityComparison: ComparisonResult;
  
  overallRecommendation: 'prefer_this' | 'prefer_other' | 'equivalent' | 'context_dependent';
  reasoning: string[];
}

interface ComparisonResult {
  advantage: 'this' | 'other' | 'neutral';
  magnitude: number; // ratio or percentage difference
  significance: 'high' | 'medium' | 'low';
}

interface ConfigurationImpactAnalysis {
  qualityImpact: {
    low: PerformanceImpact;
    medium: PerformanceImpact;
    high: PerformanceImpact;
  };
  
  optimalConfigurations: OptimalConfiguration[];
  configurationRecommendations: ConfigurationRecommendation[];
}

interface PerformanceImpact {
  fpsChange: number;
  memoryChange: MemoryMB;
  stabilityChange: number;
  userExperienceChange: number;
}

interface OptimalConfiguration {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  scenario: 'battery_saver' | 'balanced' | 'performance';
  configuration: ModuleConfiguration;
  expectedPerformance: EnhancedPerformanceMetrics;
  confidence: number;
}

interface ConfigurationRecommendation {
  type: 'quality' | 'feature' | 'compatibility';
  message: string;
  impact: PerformanceImpact;
  priority: 'high' | 'medium' | 'low';
}

interface StabilityMetrics {
  crashCount: number;
  errorCount: number;
  warningCount: number;
  
  averageSessionLength: number; // milliseconds
  successfulInitializations: number;
  failedInitializations: number;
  
  performanceVariability: number; // coefficient of variation
  memoryStability: number; // 0-1, higher is more stable
  
  recoveryTime: number; // time to recover from errors
  gracefulDegradation: boolean;
}

interface UserExperienceMetrics {
  interactionResponsiveness: number; // average response time
  visualQualityConsistency: number; // 0-1
  loadingTime: number; // initialization time
  
  userSatisfactionIndicators: {
    timeSpentActive: number;
    switchAwayRate: number; // switches per hour
    returnRate: number; // returns after switching away
  };
  
  accessibilityCompliance: {
    keyboardNavigation: boolean;
    screenReaderCompatible: boolean;
    highContrastSupport: boolean;
    reducedMotionSupport: boolean;
  };
}

// ============================================================================
// Performance Benchmarking
// ============================================================================

interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  tests: BenchmarkTest[];
  deviceRequirements: DeviceCapabilities;
}

interface BenchmarkTest {
  id: string;
  name: string;
  description: string;
  duration: number; // milliseconds
  expectedMetrics: Partial<EnhancedPerformanceMetrics>;
  
  setup: () => Promise<void>;
  execute: () => Promise<EnhancedPerformanceMetrics>;
  teardown: () => Promise<void>;
}

interface BenchmarkResult {
  moduleId: ModuleId;
  suiteId: string;
  testResults: TestResult[];
  overallScore: number;
  timestamp: number;
  deviceContext: DeviceCapabilities;
}

interface TestResult {
  testId: string;
  score: number; // 0-100
  actualMetrics: EnhancedPerformanceMetrics;
  expectedMetrics: Partial<EnhancedPerformanceMetrics>;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

// ============================================================================
// Resource Conflict Detection
// ============================================================================

interface ResourceConflict {
  id: string;
  type: 'memory' | 'gpu' | 'cpu' | 'network' | 'storage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  involvedModules: ModuleId[];
  conflictDescription: string;
  
  performanceImpact: {
    fpsReduction: number;
    memoryIncrease: MemoryMB;
    stabilityImpact: number;
  };
  
  resolutionStrategies: ResolutionStrategy[];
  automaticResolution: boolean;
}

interface ResolutionStrategy {
  id: string;
  description: string;
  effectiveness: number; // 0-1
  complexity: 'simple' | 'moderate' | 'complex';
  
  actions: ResolutionAction[];
  expectedResult: PerformanceImpact;
}

interface ResolutionAction {
  type: 'disable_module' | 'reduce_quality' | 'limit_resources' | 'schedule_execution';
  moduleId?: ModuleId;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Main Module Performance Analytics
// ============================================================================

export class ModulePerformanceAnalytics {
  private profiles = new Map<ModuleId, ModulePerformanceProfile>();
  private benchmarks = new Map<string, BenchmarkSuite>();
  private benchmarkResults = new Map<ModuleId, BenchmarkResult[]>();
  private activeModules = new Set<ModuleId>();
  private resourceConflicts = new Map<string, ResourceConflict>();
  
  private analysisInterval: number | null = null;
  private isAnalyzing = false;
  
  private readonly ANALYSIS_INTERVAL = 10000; // 10 seconds
  private readonly MAX_HISTORY_ENTRIES = 1000;
  private readonly ANALYTICS_VERSION = '1.0.0';

  constructor() {
    this.initializeDefaultBenchmarks();
    this.loadPersistedData();
  }

  // ========================================================================
  // Module Registration and Lifecycle
  // ========================================================================

  registerModule(
    moduleId: ModuleId,
    moduleName: string,
    category: string,
    version: string,
    initialConfiguration: ModuleConfiguration
  ): void {
    if (this.profiles.has(moduleId)) {
      // Update existing profile
      const profile = this.profiles.get(moduleId)!;
      profile.version = version;
      profile.lastActive = Date.now();
      profile.activationCount++;
      return;
    }

    // Create new profile
    const profile: ModulePerformanceProfile = {
      moduleId,
      moduleName,
      category,
      version,
      
      averageMetrics: this.createEmptyMetrics(),
      peakMetrics: this.createEmptyMetrics(),
      baselineMetrics: this.createEmptyMetrics(),
      
      resourceUsage: this.createEmptyResourceUsage(),
      
      performanceHistory: [],
      performanceTrends: this.createEmptyTrends(),
      
      relativePerformance: this.createEmptyRelativeMetrics(),
      
      configurationImpact: this.createEmptyConfigurationImpact(),
      
      stabilityMetrics: this.createEmptyStabilityMetrics(),
      userExperienceMetrics: this.createEmptyUXMetrics(),
      
      firstSeen: Date.now(),
      lastActive: Date.now(),
      totalActiveTime: 0,
      activationCount: 1,
      
      analyticsVersion: this.ANALYTICS_VERSION,
      lastAnalyzed: Date.now()
    };

    this.profiles.set(moduleId, profile);
    this.activeModules.add(moduleId);
  }

  activateModule(moduleId: ModuleId): void {
    const profile = this.profiles.get(moduleId);
    if (profile) {
      profile.lastActive = Date.now();
      profile.activationCount++;
      this.activeModules.add(moduleId);
    }
  }

  deactivateModule(moduleId: ModuleId): void {
    const profile = this.profiles.get(moduleId);
    if (profile) {
      // Update total active time
      profile.totalActiveTime += Date.now() - profile.lastActive;
      this.activeModules.delete(moduleId);
    }
  }

  unregisterModule(moduleId: ModuleId): void {
    this.deactivateModule(moduleId);
    // Keep profile for historical analysis, just mark as inactive
    const profile = this.profiles.get(moduleId);
    if (profile) {
      profile.totalActiveTime += Date.now() - profile.lastActive;
    }
  }

  // ========================================================================
  // Performance Data Collection
  // ========================================================================

  recordPerformanceMetrics(
    moduleId: ModuleId,
    metrics: EnhancedPerformanceMetrics,
    configuration: ModuleConfiguration,
    context: Partial<PerformanceHistoryEntry['context']> = {}
  ): void {
    const profile = this.profiles.get(moduleId);
    if (!profile) return;

    // Create history entry
    const historyEntry: PerformanceHistoryEntry = {
      timestamp: Date.now(),
      metrics,
      configuration,
      context: {
        deviceLoad: this.estimateDeviceLoad(),
        batteryLevel: context.batteryLevel,
        thermalState: context.thermalState,
        networkCondition: context.networkCondition || 'unknown',
        timeOfDay: this.getTimeOfDay(),
        ...context
      }
    };

    // Add to history
    profile.performanceHistory.push(historyEntry);
    
    // Trim history if too long
    if (profile.performanceHistory.length > this.MAX_HISTORY_ENTRIES) {
      profile.performanceHistory = profile.performanceHistory.slice(-this.MAX_HISTORY_ENTRIES / 2);
    }

    // Update aggregated metrics
    this.updateAggregatedMetrics(profile, metrics);
    
    // Update last analyzed timestamp
    profile.lastAnalyzed = Date.now();
  }

  recordResourceUsage(moduleId: ModuleId, usage: Partial<ModuleResourceUsage>): void {
    const profile = this.profiles.get(moduleId);
    if (!profile) return;

    // Update resource usage with new data
    Object.assign(profile.resourceUsage, usage);
  }

  recordStabilityEvent(
    moduleId: ModuleId,
    eventType: 'crash' | 'error' | 'warning' | 'recovery',
    details: Record<string, unknown> = {}
  ): void {
    const profile = this.profiles.get(moduleId);
    if (!profile) return;

    const stability = profile.stabilityMetrics;
    
    switch (eventType) {
      case 'crash':
        stability.crashCount++;
        break;
      case 'error':
        stability.errorCount++;
        break;
      case 'warning':
        stability.warningCount++;
        break;
      case 'recovery':
        if (details.recoveryTime) {
          stability.recoveryTime = (stability.recoveryTime + (details.recoveryTime as number)) / 2;
        }
        break;
    }
  }

  // ========================================================================
  // Analytics and Analysis
  // ========================================================================

  startAnalysis(): void {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.analysisInterval = window.setInterval(() => {
      this.performAnalysis();
    }, this.ANALYSIS_INTERVAL);
  }

  stopAnalysis(): void {
    if (!this.isAnalyzing) return;
    
    this.isAnalyzing = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  private performAnalysis(): void {
    try {
      // Analyze trends for all profiles
      this.profiles.forEach(profile => {
        this.analyzeTrends(profile);
        this.updateRelativePerformance(profile);
        this.analyzeConfigurationImpact(profile);
        this.updateStabilityMetrics(profile);
        this.updateUserExperienceMetrics(profile);
      });

      // Detect resource conflicts
      this.detectResourceConflicts();
      
      // Persist analysis results
      this.persistAnalysisData();
      
    } catch (error) {
      console.error('Error during performance analysis:', error);
    }
  }

  private analyzeTrends(profile: ModulePerformanceProfile): void {
    const history = profile.performanceHistory;
    if (history.length < 10) return; // Need minimum data

    const recentHistory = history.slice(-50); // Last 50 entries
    
    // Analyze FPS trend
    profile.performanceTrends.fpstrend = this.calculateTrend(
      recentHistory.map(h => ({ x: h.timestamp, y: h.metrics.computedFPS }))
    );

    // Analyze memory trend
    profile.performanceTrends.memoryTrend = this.calculateTrend(
      recentHistory.map(h => ({ x: h.timestamp, y: h.metrics.memoryUsage }))
    );

    // Calculate stability trend (inverse of error rate)
    const errorRates = recentHistory.map(h => {
      const errorRate = (profile.stabilityMetrics.errorCount + profile.stabilityMetrics.crashCount) / 
                       Math.max(1, profile.activationCount);
      return { x: h.timestamp, y: 1 - errorRate };
    });
    profile.performanceTrends.stabilityTrend = this.calculateTrend(errorRates);

    // Calculate efficiency trend (FPS per MB of memory)
    profile.performanceTrends.efficiencyTrend = this.calculateTrend(
      recentHistory.map(h => ({ 
        x: h.timestamp, 
        y: h.metrics.computedFPS / Math.max(1, h.metrics.memoryUsage) 
      }))
    );
  }

  private calculateTrend(dataPoints: Array<{ x: number; y: number }>): TrendAnalysis {
    if (dataPoints.length < 3) {
      return {
        direction: 'stable',
        rate: 0,
        confidence: 0,
        significance: 'low',
        projectedValue: dataPoints[dataPoints.length - 1]?.y || 0
      };
    }

    // Linear regression
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    dataPoints.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient for confidence
    const meanX = sumX / n;
    const meanY = sumY / n;
    let numerator = 0, denomX = 0, denomY = 0;
    
    dataPoints.forEach(point => {
      const deltaX = point.x - meanX;
      const deltaY = point.y - meanY;
      numerator += deltaX * deltaY;
      denomX += deltaX * deltaX;
      denomY += deltaY * deltaY;
    });
    
    const correlation = Math.abs(numerator / Math.sqrt(denomX * denomY));
    
    // Project 7 days into future
    const futureX = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const projectedValue = slope * futureX + intercept;
    
    return {
      direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable',
      rate: slope * (24 * 60 * 60 * 1000), // per day
      confidence: correlation,
      significance: correlation > 0.7 ? 'high' : correlation > 0.5 ? 'medium' : 'low',
      projectedValue: Math.max(0, projectedValue)
    };
  }

  private updateRelativePerformance(profile: ModulePerformanceProfile): void {
    const allProfiles = Array.from(this.profiles.values());
    const sameCategory = allProfiles.filter(p => p.category === profile.category);
    
    if (sameCategory.length < 2) return;
    
    // Calculate ranks
    const fpsValues = sameCategory.map(p => p.averageMetrics.computedFPS).sort((a, b) => b - a);
    const memoryValues = sameCategory.map(p => p.averageMetrics.memoryUsage).sort((a, b) => a - b);
    const stabilityValues = sameCategory.map(p => 1 - (p.stabilityMetrics.errorCount / Math.max(1, p.activationCount))).sort((a, b) => b - a);
    
    profile.relativePerformance.fpsRank = fpsValues.indexOf(profile.averageMetrics.computedFPS) + 1;
    profile.relativePerformance.memoryRank = memoryValues.indexOf(profile.averageMetrics.memoryUsage) + 1;
    profile.relativePerformance.stabilityRank = stabilityValues.indexOf(1 - (profile.stabilityMetrics.errorCount / Math.max(1, profile.activationCount))) + 1;
    
    // Calculate overall rank (weighted average)
    const totalModules = sameCategory.length;
    const fpsScore = (totalModules - profile.relativePerformance.fpsRank + 1) / totalModules;
    const memoryScore = (totalModules - profile.relativePerformance.memoryRank + 1) / totalModules;
    const stabilityScore = (totalModules - profile.relativePerformance.stabilityRank + 1) / totalModules;
    
    profile.relativePerformance.performanceScore = Math.round((fpsScore * 0.4 + memoryScore * 0.3 + stabilityScore * 0.3) * 100);
    profile.relativePerformance.efficiencyScore = Math.round((profile.averageMetrics.computedFPS / Math.max(1, profile.averageMetrics.memoryUsage)) * 10);
    
    // Generate comparisons with other modules in same category
    profile.relativePerformance.comparisons = this.generateComparisons(profile, sameCategory);
  }

  private generateComparisons(profile: ModulePerformanceProfile, peers: ModulePerformanceProfile[]): ModuleComparison[] {
    const comparisons: ModuleComparison[] = [];
    
    // Compare with top 3 performers
    const topPerformers = peers
      .filter(p => p.moduleId !== profile.moduleId)
      .sort((a, b) => b.relativePerformance.performanceScore - a.relativePerformance.performanceScore)
      .slice(0, 3);
    
    topPerformers.forEach(peer => {
      comparisons.push({
        comparedWith: peer.moduleId,
        category: 'alternative',
        
        fpsComparison: this.compareMetric(profile.averageMetrics.computedFPS, peer.averageMetrics.computedFPS, 'higher_is_better'),
        memoryComparison: this.compareMetric(profile.averageMetrics.memoryUsage, peer.averageMetrics.memoryUsage, 'lower_is_better'),
        stabilityComparison: this.compareMetric(
          1 - (profile.stabilityMetrics.errorCount / Math.max(1, profile.activationCount)),
          1 - (peer.stabilityMetrics.errorCount / Math.max(1, peer.activationCount)),
          'higher_is_better'
        ),
        
        overallRecommendation: this.generateOverallRecommendation(profile, peer),
        reasoning: this.generateReasoningForComparison(profile, peer)
      });
    });
    
    return comparisons;
  }

  private compareMetric(value1: number, value2: number, preference: 'higher_is_better' | 'lower_is_better'): ComparisonResult {
    const ratio = value1 / Math.max(0.001, value2);
    const advantage = preference === 'higher_is_better' 
      ? (ratio > 1.05 ? 'this' : ratio < 0.95 ? 'other' : 'neutral')
      : (ratio < 0.95 ? 'this' : ratio > 1.05 ? 'other' : 'neutral');
    
    const magnitude = Math.abs(ratio - 1);
    const significance = magnitude > 0.2 ? 'high' : magnitude > 0.1 ? 'medium' : 'low';
    
    return { advantage, magnitude, significance };
  }

  private generateOverallRecommendation(profile: ModulePerformanceProfile, peer: ModulePerformanceProfile): ModuleComparison['overallRecommendation'] {
    const profileScore = profile.relativePerformance.performanceScore;
    const peerScore = peer.relativePerformance.performanceScore;
    
    if (profileScore > peerScore + 10) return 'prefer_this';
    if (peerScore > profileScore + 10) return 'prefer_other';
    if (Math.abs(profileScore - peerScore) < 5) return 'equivalent';
    return 'context_dependent';
  }

  private generateReasoningForComparison(profile: ModulePerformanceProfile, peer: ModulePerformanceProfile): string[] {
    const reasoning: string[] = [];
    
    if (profile.averageMetrics.computedFPS > peer.averageMetrics.computedFPS * 1.1) {
      reasoning.push(`${profile.moduleName} provides ${((profile.averageMetrics.computedFPS / peer.averageMetrics.computedFPS - 1) * 100).toFixed(0)}% better frame rate`);
    }
    
    if (profile.averageMetrics.memoryUsage < peer.averageMetrics.memoryUsage * 0.9) {
      reasoning.push(`${profile.moduleName} uses ${((1 - profile.averageMetrics.memoryUsage / peer.averageMetrics.memoryUsage) * 100).toFixed(0)}% less memory`);
    }
    
    if (profile.stabilityMetrics.errorCount < peer.stabilityMetrics.errorCount) {
      reasoning.push(`${profile.moduleName} has fewer stability issues`);
    }
    
    return reasoning;
  }

  // ========================================================================
  // Resource Conflict Detection
  // ========================================================================

  private detectResourceConflicts(): void {
    const activeProfiles = Array.from(this.profiles.values())
      .filter(p => this.activeModules.has(p.moduleId));
    
    if (activeProfiles.length < 2) return;
    
    // Check for memory conflicts
    this.detectMemoryConflicts(activeProfiles);
    
    // Check for GPU resource conflicts
    this.detectGpuConflicts(activeProfiles);
    
    // Check for CPU conflicts
    this.detectCpuConflicts(activeProfiles);
  }

  private detectMemoryConflicts(profiles: ModulePerformanceProfile[]): void {
    const totalMemory = profiles.reduce((sum, p) => sum + p.averageMetrics.memoryUsage, 0);
    const highMemoryModules = profiles.filter(p => p.averageMetrics.memoryUsage > 100);
    
    if (totalMemory > 500 || highMemoryModules.length > 2) {
      const conflictId = `memory_conflict_${Date.now()}`;
      
      this.resourceConflicts.set(conflictId, {
        id: conflictId,
        type: 'memory',
        severity: totalMemory > 800 ? 'critical' : totalMemory > 650 ? 'high' : 'medium',
        involvedModules: profiles.map(p => p.moduleId),
        conflictDescription: `High memory usage detected: ${totalMemory.toFixed(0)}MB total`,
        performanceImpact: {
          fpsReduction: Math.min(30, (totalMemory - 500) * 0.05),
          memoryIncrease: createMemoryMB(0),
          stabilityImpact: Math.min(50, (totalMemory - 500) * 0.1)
        },
        resolutionStrategies: this.generateMemoryResolutionStrategies(profiles),
        automaticResolution: true
      });
    }
  }

  private detectGpuConflicts(profiles: ModulePerformanceProfile[]): void {
    const totalShaders = profiles.reduce((sum, p) => sum + p.resourceUsage.shaderPrograms, 0);
    const totalTextures = profiles.reduce((sum, p) => sum + p.resourceUsage.textures, 0);
    
    if (totalShaders > 20 || totalTextures > 50) {
      const conflictId = `gpu_conflict_${Date.now()}`;
      
      this.resourceConflicts.set(conflictId, {
        id: conflictId,
        type: 'gpu',
        severity: 'medium',
        involvedModules: profiles.map(p => p.moduleId),
        conflictDescription: `High GPU resource usage: ${totalShaders} shaders, ${totalTextures} textures`,
        performanceImpact: {
          fpsReduction: Math.min(20, (totalShaders - 20) + (totalTextures - 50) * 0.2),
          memoryIncrease: createMemoryMB((totalTextures - 50) * 2),
          stabilityImpact: 10
        },
        resolutionStrategies: this.generateGpuResolutionStrategies(profiles),
        automaticResolution: false
      });
    }
  }

  private detectCpuConflicts(profiles: ModulePerformanceProfile[]): void {
    const totalCpu = profiles.reduce((sum, p) => sum + p.resourceUsage.renderCpu + p.resourceUsage.updateCpu, 0);
    
    if (totalCpu > 80) {
      const conflictId = `cpu_conflict_${Date.now()}`;
      
      this.resourceConflicts.set(conflictId, {
        id: conflictId,
        type: 'cpu',
        severity: totalCpu > 95 ? 'high' : 'medium',
        involvedModules: profiles.map(p => p.moduleId),
        conflictDescription: `High CPU usage: ${totalCpu.toFixed(0)}%`,
        performanceImpact: {
          fpsReduction: Math.min(40, (totalCpu - 80) * 0.5),
          memoryIncrease: createMemoryMB(0),
          stabilityImpact: Math.min(30, (totalCpu - 80) * 0.3)
        },
        resolutionStrategies: this.generateCpuResolutionStrategies(profiles),
        automaticResolution: true
      });
    }
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private createEmptyMetrics(): EnhancedPerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      timestamp: Date.now(),
      computedFPS: 0,
      averageFrameTime: 0,
      memoryEfficiency: 0,
      performanceScore: 0,
      recommendations: []
    };
  }

  private createEmptyResourceUsage(): ModuleResourceUsage {
    return {
      heapMemory: { allocated: createMemoryMB(0), peak: createMemoryMB(0), average: createMemoryMB(0), growth: createMemoryMB(0), leaks: 0 },
      textureMemory: { allocated: createMemoryMB(0), peak: createMemoryMB(0), average: createMemoryMB(0), growth: createMemoryMB(0), leaks: 0 },
      bufferMemory: { allocated: createMemoryMB(0), peak: createMemoryMB(0), average: createMemoryMB(0), growth: createMemoryMB(0), leaks: 0 },
      renderCpu: 0,
      updateCpu: 0,
      initializationCpu: 0,
      shaderPrograms: 0,
      textures: 0,
      vertexBuffers: 0,
      drawCalls: 0,
      assetsLoaded: 0,
      totalAssetSize: 0,
      networkRequests: 0,
      localStorage: 0,
      indexedDB: 0,
      cacheUsage: 0
    };
  }

  private createEmptyTrends(): PerformanceTrends {
    const emptyTrend: TrendAnalysis = {
      direction: 'stable',
      rate: 0,
      confidence: 0,
      significance: 'low',
      projectedValue: 0
    };
    
    return {
      fpstrend: { ...emptyTrend },
      memoryTrend: { ...emptyTrend },
      stabilityTrend: { ...emptyTrend },
      efficiencyTrend: { ...emptyTrend }
    };
  }

  private createEmptyRelativeMetrics(): RelativePerformanceMetrics {
    return {
      fpsRank: 0,
      memoryRank: 0,
      stabilityRank: 0,
      overallRank: 0,
      performanceScore: 0,
      efficiencyScore: 0,
      compatibilityScore: 0,
      comparisons: []
    };
  }

  private createEmptyConfigurationImpact(): ConfigurationImpactAnalysis {
    const emptyImpact: PerformanceImpact = {
      fpsChange: 0,
      memoryChange: createMemoryMB(0),
      stabilityChange: 0,
      userExperienceChange: 0
    };
    
    return {
      qualityImpact: {
        low: { ...emptyImpact },
        medium: { ...emptyImpact },
        high: { ...emptyImpact }
      },
      optimalConfigurations: [],
      configurationRecommendations: []
    };
  }

  private createEmptyStabilityMetrics(): StabilityMetrics {
    return {
      crashCount: 0,
      errorCount: 0,
      warningCount: 0,
      averageSessionLength: 0,
      successfulInitializations: 0,
      failedInitializations: 0,
      performanceVariability: 0,
      memoryStability: 1,
      recoveryTime: 0,
      gracefulDegradation: true
    };
  }

  private createEmptyUXMetrics(): UserExperienceMetrics {
    return {
      interactionResponsiveness: 0,
      visualQualityConsistency: 1,
      loadingTime: 0,
      userSatisfactionIndicators: {
        timeSpentActive: 0,
        switchAwayRate: 0,
        returnRate: 1
      },
      accessibilityCompliance: {
        keyboardNavigation: false,
        screenReaderCompatible: false,
        highContrastSupport: false,
        reducedMotionSupport: false
      }
    };
  }

  private updateAggregatedMetrics(profile: ModulePerformanceProfile, newMetrics: EnhancedPerformanceMetrics): void {
    const history = profile.performanceHistory;
    if (history.length === 0) return;
    
    // Calculate averages
    const recentMetrics = history.slice(-50).map(h => h.metrics);
    
    profile.averageMetrics = {
      fps: this.average(recentMetrics.map(m => m.fps)),
      frameTime: this.average(recentMetrics.map(m => m.frameTime)),
      memoryUsage: this.average(recentMetrics.map(m => m.memoryUsage)),
      renderTime: this.average(recentMetrics.map(m => m.renderTime)),
      timestamp: Date.now(),
      computedFPS: this.average(recentMetrics.map(m => m.computedFPS)),
      averageFrameTime: this.average(recentMetrics.map(m => m.averageFrameTime)),
      memoryEfficiency: this.average(recentMetrics.map(m => m.memoryEfficiency)),
      performanceScore: this.average(recentMetrics.map(m => m.performanceScore)),
      recommendations: []
    };
    
    // Update peaks
    profile.peakMetrics = {
      fps: Math.max(profile.peakMetrics.fps, newMetrics.fps),
      frameTime: Math.max(profile.peakMetrics.frameTime, newMetrics.frameTime),
      memoryUsage: Math.max(profile.peakMetrics.memoryUsage, newMetrics.memoryUsage),
      renderTime: Math.max(profile.peakMetrics.renderTime, newMetrics.renderTime),
      timestamp: Date.now(),
      computedFPS: Math.max(profile.peakMetrics.computedFPS, newMetrics.computedFPS),
      averageFrameTime: Math.max(profile.peakMetrics.averageFrameTime, newMetrics.averageFrameTime),
      memoryEfficiency: Math.max(profile.peakMetrics.memoryEfficiency, newMetrics.memoryEfficiency),
      performanceScore: Math.max(profile.peakMetrics.performanceScore, newMetrics.performanceScore),
      recommendations: []
    };
  }

  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private estimateDeviceLoad(): number {
    // Simple heuristic based on active modules and their resource usage
    const activeProfiles = Array.from(this.profiles.values())
      .filter(p => this.activeModules.has(p.moduleId));
    
    const totalCpu = activeProfiles.reduce((sum, p) => sum + p.resourceUsage.renderCpu + p.resourceUsage.updateCpu, 0);
    const totalMemory = activeProfiles.reduce((sum, p) => sum + p.averageMetrics.memoryUsage, 0);
    
    return Math.min(1, (totalCpu / 100) * 0.6 + (totalMemory / 1000) * 0.4);
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private initializeDefaultBenchmarks(): void {
    // This would contain benchmark suites for different module types
    // Simplified for brevity
  }

  private loadPersistedData(): void {
    try {
      const saved = localStorage.getItem('module-analytics-profiles');
      if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([moduleId, profileData]) => {
          this.profiles.set(moduleId as ModuleId, profileData as ModulePerformanceProfile);
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics data:', error);
    }
  }

  private persistAnalysisData(): void {
    try {
      const profileData = Object.fromEntries(this.profiles);
      localStorage.setItem('module-analytics-profiles', JSON.stringify(profileData));
    } catch (error) {
      console.warn('Failed to persist analytics data:', error);
    }
  }

  private generateMemoryResolutionStrategies(profiles: ModulePerformanceProfile[]): ResolutionStrategy[] {
    return [
      {
        id: 'reduce_quality',
        description: 'Reduce quality settings for high memory modules',
        effectiveness: 0.8,
        complexity: 'simple',
        actions: profiles
          .filter(p => p.averageMetrics.memoryUsage > 100)
          .map(p => ({
            type: 'reduce_quality' as const,
            moduleId: p.moduleId,
            parameters: { quality: 'medium' }
          })),
        expectedResult: {
          fpsChange: 5,
          memoryChange: createMemoryMB(-100),
          stabilityChange: 10,
          userExperienceChange: -5
        }
      }
    ];
  }

  private generateGpuResolutionStrategies(profiles: ModulePerformanceProfile[]): ResolutionStrategy[] {
    return [
      {
        id: 'limit_shaders',
        description: 'Limit shader usage for GPU-intensive modules',
        effectiveness: 0.7,
        complexity: 'moderate',
        actions: profiles
          .filter(p => p.resourceUsage.shaderPrograms > 5)
          .map(p => ({
            type: 'limit_resources' as const,
            moduleId: p.moduleId,
            parameters: { maxShaders: 3 }
          })),
        expectedResult: {
          fpsChange: 10,
          memoryChange: createMemoryMB(-20),
          stabilityChange: 5,
          userExperienceChange: -2
        }
      }
    ];
  }

  private generateCpuResolutionStrategies(profiles: ModulePerformanceProfile[]): ResolutionStrategy[] {
    return [
      {
        id: 'schedule_execution',
        description: 'Schedule high-CPU modules to run alternately',
        effectiveness: 0.9,
        complexity: 'complex',
        actions: [
          {
            type: 'schedule_execution' as const,
            parameters: { strategy: 'round_robin' }
          }
        ],
        expectedResult: {
          fpsChange: 15,
          memoryChange: createMemoryMB(0),
          stabilityChange: 15,
          userExperienceChange: 0
        }
      }
    ];
  }

  // ========================================================================
  // Public API Methods
  // ========================================================================

  getModuleProfile(moduleId: ModuleId): ModulePerformanceProfile | null {
    return this.profiles.get(moduleId) || null;
  }

  getAllProfiles(): ModulePerformanceProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfilesByCategory(category: string): ModulePerformanceProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.category === category);
  }

  getTopPerformers(category?: string, limit: number = 5): ModulePerformanceProfile[] {
    let profiles = Array.from(this.profiles.values());
    
    if (category) {
      profiles = profiles.filter(p => p.category === category);
    }
    
    return profiles
      .sort((a, b) => b.relativePerformance.performanceScore - a.relativePerformance.performanceScore)
      .slice(0, limit);
  }

  getResourceConflicts(): ResourceConflict[] {
    return Array.from(this.resourceConflicts.values());
  }

  resolveConflict(conflictId: string, strategyId: string): boolean {
    const conflict = this.resourceConflicts.get(conflictId);
    if (!conflict) return false;
    
    const strategy = conflict.resolutionStrategies.find(s => s.id === strategyId);
    if (!strategy) return false;
    
    // Execute resolution actions
    // This would integrate with the actual module management system
    console.log(`Resolving conflict ${conflictId} with strategy ${strategyId}`);
    
    // Remove resolved conflict
    this.resourceConflicts.delete(conflictId);
    
    return true;
  }

  exportAnalyticsData(): {
    profiles: ModulePerformanceProfile[];
    conflicts: ResourceConflict[];
    timestamp: number;
    version: string;
  } {
    return {
      profiles: this.getAllProfiles(),
      conflicts: this.getResourceConflicts(),
      timestamp: Date.now(),
      version: this.ANALYTICS_VERSION
    };
  }

  cleanup(): void {
    this.stopAnalysis();
    this.persistAnalysisData();
    this.profiles.clear();
    this.activeModules.clear();
    this.resourceConflicts.clear();
  }
}

export default ModulePerformanceAnalytics;