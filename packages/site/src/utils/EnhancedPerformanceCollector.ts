/**
 * Enhanced Performance Metrics Collector
 * 
 * Advanced performance monitoring system with New Relic integration capabilities,
 * thermal monitoring, GPU utilization tracking, and privacy-respecting analytics.
 */

import {
  PerformanceMetrics,
  MemoryStats,
  DeviceCapabilities
} from '@/interfaces/BackgroundSystemV3';
import {
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  ModuleId
} from '@/types/utilities';

// ============================================================================
// Extended Performance Metrics Interface
// ============================================================================

export interface AdvancedPerformanceMetrics extends EnhancedPerformanceMetrics {
  // GPU Metrics
  gpuUtilization: number; // 0-100%
  webglContextHealth: boolean;
  gpuMemoryUsage: number; // MB
  renderQueueLength: number;
  
  // Network Metrics
  networkLatency: number; // ms
  resourceLoadTimes: ResourceLoadTime[];
  connectionType: string;
  effectiveConnectionType: string;
  
  // Thermal and Power Metrics
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
  cpuTemperature: number; // °C (estimated)
  batteryLevel: number; // 0-1
  batteryCharging: boolean;
  powerEfficiency: number; // FPS per watt estimate
  
  // User Experience Metrics
  perceivedPerformance: number; // 0-100
  interactionLatency: number; // ms
  visualQualityScore: number; // 0-100
  
  // New Relic Correlation
  newRelicTraceId?: string;
  newRelicSpanId?: string;
  correlationTimestamp: number;
}

interface ResourceLoadTime {
  url: string;
  type: 'script' | 'style' | 'image' | 'font';
  loadTime: number;
  size: number;
}

interface ThermalMonitoringData {
  timestamp: number;
  estimatedTemperature: number;
  throttlingDetected: boolean;
  performanceScaling: number;
}

interface NetworkPerformanceData {
  latency: number;
  bandwidth: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  resourceLoadPerformance: number;
}

// ============================================================================
// GPU Utilization Monitor
// ============================================================================

class GPUUtilizationMonitor {
  private webglContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private lastRenderTime = 0;
  private renderQueue: number[] = [];
  private gpuMemoryUsage = 0;
  
  constructor() {
    this.initWebGLContext();
  }
  
  private initWebGLContext(): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      this.webglContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
    } catch (error) {
      console.warn('Failed to initialize WebGL context for GPU monitoring:', error);
    }
  }
  
  updateRenderMetrics(renderTime: number): void {
    this.renderQueue.push(renderTime);
    if (this.renderQueue.length > 60) { // Keep last 60 frames
      this.renderQueue.shift();
    }
    this.lastRenderTime = renderTime;
  }
  
  getGPUMetrics(): {
    utilization: number;
    contextHealth: boolean;
    memoryUsage: number;
    queueLength: number;
  } {
    const utilization = this.calculateGPUUtilization();
    const contextHealth = this.checkWebGLContextHealth();
    
    return {
      utilization,
      contextHealth,
      memoryUsage: this.gpuMemoryUsage,
      queueLength: this.renderQueue.length
    };
  }
  
  private calculateGPUUtilization(): number {
    if (this.renderQueue.length < 10) return 0;
    
    const avgRenderTime = this.renderQueue.reduce((sum, time) => sum + time, 0) / this.renderQueue.length;
    const targetFrameTime = 16.67; // 60fps
    
    // Estimate GPU utilization based on render time vs target
    const utilization = Math.min(100, (avgRenderTime / targetFrameTime) * 100);
    return Math.round(utilization);
  }
  
  private checkWebGLContextHealth(): boolean {
    if (!this.webglContext) return false;
    
    try {
      const contextLost = this.webglContext.isContextLost();
      const error = this.webglContext.getError();
      return !contextLost && error === this.webglContext.NO_ERROR;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Thermal Monitoring System
// ============================================================================

class ThermalMonitor {
  private temperatureHistory: ThermalMonitoringData[] = [];
  private performanceBaseline = 0;
  private throttlingDetected = false;
  
  updateThermalData(currentPerformance: number): void {
    const estimatedTemp = this.estimateTemperature(currentPerformance);
    const throttling = this.detectThrottling(currentPerformance);
    
    const data: ThermalMonitoringData = {
      timestamp: Date.now(),
      estimatedTemperature: estimatedTemp,
      throttlingDetected: throttling,
      performanceScaling: currentPerformance / Math.max(this.performanceBaseline, 1)
    };
    
    this.temperatureHistory.push(data);
    if (this.temperatureHistory.length > 300) { // 5 minutes at 1s intervals
      this.temperatureHistory.shift();
    }
    
    // Update baseline performance
    if (this.performanceBaseline === 0 || currentPerformance > this.performanceBaseline * 1.1) {
      this.performanceBaseline = currentPerformance;
    }
  }
  
  private estimateTemperature(currentPerformance: number): number {
    // Estimate temperature based on performance degradation
    // This is a heuristic approach since direct temperature access isn't available
    const baseTemp = 35; // Assume 35°C base temperature
    const performanceRatio = this.performanceBaseline > 0 ? currentPerformance / this.performanceBaseline : 1;
    
    if (performanceRatio < 0.6) return 85; // Critical throttling
    if (performanceRatio < 0.7) return 75; // Serious throttling
    if (performanceRatio < 0.8) return 65; // Fair performance
    if (performanceRatio < 0.9) return 55; // Slight impact
    
    return baseTemp + (1 - performanceRatio) * 20; // Normal operation
  }
  
  private detectThrottling(currentPerformance: number): boolean {
    if (this.temperatureHistory.length < 10) return false;
    
    const recent = this.temperatureHistory.slice(-10);
    const performanceDrop = recent.filter(d => d.performanceScaling < 0.8).length;
    
    this.throttlingDetected = performanceDrop > 5; // 50% of recent samples show degradation
    return this.throttlingDetected;
  }
  
  getThermalState(): {
    state: 'normal' | 'fair' | 'serious' | 'critical';
    temperature: number;
    throttling: boolean;
  } {
    const latest = this.temperatureHistory[this.temperatureHistory.length - 1];
    if (!latest) return { state: 'normal', temperature: 35, throttling: false };
    
    let state: 'normal' | 'fair' | 'serious' | 'critical' = 'normal';
    if (latest.estimatedTemperature > 80) state = 'critical';
    else if (latest.estimatedTemperature > 70) state = 'serious';
    else if (latest.estimatedTemperature > 60) state = 'fair';
    
    return {
      state,
      temperature: latest.estimatedTemperature,
      throttling: latest.throttlingDetected
    };
  }
}

// ============================================================================
// Network Performance Monitor
// ============================================================================

class NetworkPerformanceMonitor {
  private resourceObserver: PerformanceObserver | null = null;
  private resourceLoadTimes: ResourceLoadTime[] = [];
  private networkLatency = 0;
  
  constructor() {
    this.initResourceObserver();
  }
  
  private initResourceObserver(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceLoad(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'navigation') {
            this.recordNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });
      
      this.resourceObserver.observe({ entryTypes: ['resource', 'navigation'] });
    } catch (error) {
      console.warn('Failed to initialize resource observer:', error);
    }
  }
  
  private recordResourceLoad(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;
    const size = entry.transferSize || 0;
    
    const resourceLoad: ResourceLoadTime = {
      url: entry.name,
      type: resourceType,
      loadTime,
      size
    };
    
    this.resourceLoadTimes.push(resourceLoad);
    if (this.resourceLoadTimes.length > 100) { // Keep last 100 resources
      this.resourceLoadTimes.shift();
    }
  }
  
  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    // Calculate network latency from navigation timing
    this.networkLatency = entry.responseStart - entry.requestStart;
  }
  
  private getResourceType(url: string): 'script' | 'style' | 'image' | 'font' {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    return 'script'; // Default
  }
  
  getNetworkMetrics(): NetworkPerformanceData {
    const avgLoadTime = this.calculateAverageLoadTime();
    const connectionInfo = this.getConnectionInfo();
    
    return {
      latency: this.networkLatency,
      bandwidth: this.estimateBandwidth(),
      connectionQuality: this.assessConnectionQuality(avgLoadTime),
      resourceLoadPerformance: Math.max(0, 100 - (avgLoadTime / 10)) // Scale to 0-100
    };
  }
  
  private calculateAverageLoadTime(): number {
    if (this.resourceLoadTimes.length === 0) return 0;
    
    const totalTime = this.resourceLoadTimes.reduce((sum, resource) => sum + resource.loadTime, 0);
    return totalTime / this.resourceLoadTimes.length;
  }
  
  private estimateBandwidth(): number {
    const recentResources = this.resourceLoadTimes.slice(-10); // Last 10 resources
    if (recentResources.length === 0) return 0;
    
    const totalBytes = recentResources.reduce((sum, resource) => sum + resource.size, 0);
    const totalTime = recentResources.reduce((sum, resource) => sum + resource.loadTime, 0);
    
    return totalTime > 0 ? (totalBytes * 8) / (totalTime / 1000) : 0; // bits per second
  }
  
  private getConnectionInfo(): { type: string; effectiveType: string } {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    return {
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown'
    };
  }
  
  private assessConnectionQuality(avgLoadTime: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (avgLoadTime < 100) return 'excellent';
    if (avgLoadTime < 300) return 'good';
    if (avgLoadTime < 800) return 'fair';
    return 'poor';
  }
  
  getRecentResourceLoads(): ResourceLoadTime[] {
    return [...this.resourceLoadTimes];
  }
}

// ============================================================================
// New Relic Integration
// ============================================================================

class NewRelicIntegration {
  private isEnabled = false;
  private newrelicApi: any = null;
  
  constructor() {
    this.checkNewRelicAvailability();
  }
  
  private checkNewRelicAvailability(): void {
    this.isEnabled = !!(window as any).newrelic || !!(window as any).NREUM;
    if (this.isEnabled) {
      this.newrelicApi = (window as any).newrelic || (window as any).NREUM;
    }
  }
  
  correlateMetrics(metrics: AdvancedPerformanceMetrics): {
    traceId?: string;
    spanId?: string;
    timestamp: number;
  } {
    if (!this.isEnabled) {
      return { timestamp: Date.now() };
    }
    
    try {
      // Record custom metrics in New Relic
      if (this.newrelicApi?.addPageAction) {
        this.newrelicApi.addPageAction('performance_metrics', {
          fps: metrics.computedFPS,
          memoryUsage: metrics.memoryUsage,
          gpuUtilization: metrics.gpuUtilization,
          thermalState: metrics.thermalState,
          timestamp: Date.now()
        });
      }
      
      // Get trace ID if available
      const traceId = this.newrelicApi?.getTraceId?.() || undefined;
      const spanId = this.newrelicApi?.getCurrentSpanId?.() || undefined;
      
      return {
        traceId,
        spanId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('New Relic correlation error:', error);
      return { timestamp: Date.now() };
    }
  }
  
  recordPerformanceAlert(alert: PerformanceRecommendation): void {
    if (!this.isEnabled) return;
    
    try {
      if (this.newrelicApi?.noticeError) {
        this.newrelicApi.noticeError(new Error(`Performance Alert: ${alert.message}`), {
          type: alert.type,
          severity: alert.severity,
          module: alert.action?.parameters?.moduleId || 'unknown'
        });
      }
    } catch (error) {
      console.warn('Failed to record performance alert in New Relic:', error);
    }
  }
}

// ============================================================================
// Enhanced Performance Collector
// ============================================================================

export class EnhancedPerformanceCollector {
  private gpuMonitor: GPUUtilizationMonitor;
  private thermalMonitor: ThermalMonitor;
  private networkMonitor: NetworkPerformanceMonitor;
  private newRelicIntegration: NewRelicIntegration;
  
  private batteryLevel = 1;
  private batteryCharging = false;
  private interactionLatencies: number[] = [];
  
  constructor() {
    this.gpuMonitor = new GPUUtilizationMonitor();
    this.thermalMonitor = new ThermalMonitor();
    this.networkMonitor = new NetworkPerformanceMonitor();
    this.newRelicIntegration = new NewRelicIntegration();
    
    this.initBatteryMonitoring();
    this.initInteractionMonitoring();
  }
  
  private async initBatteryMonitoring(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level;
        this.batteryCharging = battery.charging;
        
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
        });
        
        battery.addEventListener('chargingchange', () => {
          this.batteryCharging = battery.charging;
        });
      } catch (error) {
        console.warn('Battery monitoring not available:', error);
      }
    }
  }
  
  private initInteractionMonitoring(): void {
    const recordInteractionLatency = (event: Event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const latency = performance.now() - startTime;
        this.interactionLatencies.push(latency);
        if (this.interactionLatencies.length > 20) {
          this.interactionLatencies.shift();
        }
      });
    };
    
    document.addEventListener('click', recordInteractionLatency, { passive: true });
    document.addEventListener('touchstart', recordInteractionLatency, { passive: true });
    document.addEventListener('keydown', recordInteractionLatency, { passive: true });
  }
  
  collectAdvancedMetrics(baseMetrics: EnhancedPerformanceMetrics): AdvancedPerformanceMetrics {
    // Update component monitors
    this.thermalMonitor.updateThermalData(baseMetrics.performanceScore);
    
    // Collect GPU metrics
    const gpuMetrics = this.gpuMonitor.getGPUMetrics();
    
    // Collect network metrics
    const networkMetrics = this.networkMonitor.getNetworkMetrics();
    
    // Get thermal state
    const thermalState = this.thermalMonitor.getThermalState();
    
    // Calculate derived metrics
    const perceivedPerformance = this.calculatePerceivedPerformance(baseMetrics, gpuMetrics, networkMetrics);
    const interactionLatency = this.getAverageInteractionLatency();
    const visualQualityScore = this.calculateVisualQualityScore(baseMetrics, gpuMetrics);
    const powerEfficiency = this.calculatePowerEfficiency(baseMetrics.computedFPS);
    
    // Get connection info
    const connectionInfo = this.getConnectionInfo();
    
    const advancedMetrics: AdvancedPerformanceMetrics = {
      ...baseMetrics,
      
      // GPU Metrics
      gpuUtilization: gpuMetrics.utilization,
      webglContextHealth: gpuMetrics.contextHealth,
      gpuMemoryUsage: gpuMetrics.memoryUsage,
      renderQueueLength: gpuMetrics.queueLength,
      
      // Network Metrics
      networkLatency: networkMetrics.latency,
      resourceLoadTimes: this.networkMonitor.getRecentResourceLoads(),
      connectionType: connectionInfo.type,
      effectiveConnectionType: connectionInfo.effectiveType,
      
      // Thermal and Power Metrics
      thermalState: thermalState.state,
      cpuTemperature: thermalState.temperature,
      batteryLevel: this.batteryLevel,
      batteryCharging: this.batteryCharging,
      powerEfficiency,
      
      // User Experience Metrics
      perceivedPerformance,
      interactionLatency,
      visualQualityScore,
      
      // Correlation
      correlationTimestamp: Date.now()
    };
    
    // New Relic correlation if enabled
    const correlation = this.newRelicIntegration.correlateMetrics(advancedMetrics);
    advancedMetrics.newRelicTraceId = correlation.traceId;
    advancedMetrics.newRelicSpanId = correlation.spanId;
    advancedMetrics.correlationTimestamp = correlation.timestamp;
    
    return advancedMetrics;
  }
  
  private calculatePerceivedPerformance(
    base: EnhancedPerformanceMetrics,
    gpu: any,
    network: NetworkPerformanceData
  ): number {
    // Weighted calculation of perceived performance
    const fpsWeight = 0.4;
    const memoryWeight = 0.2;
    const networkWeight = 0.2;
    const gpuWeight = 0.2;
    
    const fpsScore = Math.min(100, (base.computedFPS / 60) * 100);
    const memoryScore = Math.max(0, 100 - base.memoryUsage);
    const networkScore = network.resourceLoadPerformance;
    const gpuScore = Math.max(0, 100 - gpu.utilization);
    
    return Math.round(
      fpsScore * fpsWeight +
      memoryScore * memoryWeight +
      networkScore * networkWeight +
      gpuScore * gpuWeight
    );
  }
  
  private getAverageInteractionLatency(): number {
    if (this.interactionLatencies.length === 0) return 0;
    
    const sum = this.interactionLatencies.reduce((total, latency) => total + latency, 0);
    return sum / this.interactionLatencies.length;
  }
  
  private calculateVisualQualityScore(base: EnhancedPerformanceMetrics, gpu: any): number {
    // Base score from frame rate consistency
    const frameConsistency = Math.max(0, 100 - (base.averageFrameTime - 16.67));
    
    // GPU health factor
    const gpuFactor = gpu.contextHealth ? 1 : 0.5;
    
    // Memory efficiency factor
    const memoryFactor = Math.min(1, base.memoryEfficiency / 50);
    
    return Math.round(frameConsistency * gpuFactor * memoryFactor);
  }
  
  private calculatePowerEfficiency(fps: number): number {
    // Estimate FPS per watt (simplified calculation)
    const basePowerUsage = 10; // Assume 10W base consumption
    const additionalPower = (fps / 60) * 20; // Scale with performance
    const totalPower = basePowerUsage + additionalPower;
    
    return fps / totalPower;
  }
  
  private getConnectionInfo(): { type: string; effectiveType: string } {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    return {
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown'
    };
  }
  
  updateRenderMetrics(moduleId: ModuleId, renderTime: number): void {
    this.gpuMonitor.updateRenderMetrics(renderTime);
  }
  
  recordPerformanceAlert(alert: PerformanceRecommendation): void {
    this.newRelicIntegration.recordPerformanceAlert(alert);
  }
  
  cleanup(): void {
    // Clean up event listeners and observers
    this.networkMonitor = new NetworkPerformanceMonitor(); // Reinitialize to reset observers
  }
}

export const enhancedPerformanceCollector = new EnhancedPerformanceCollector();