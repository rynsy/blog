/**
 * Comprehensive Metrics Collection System
 * 
 * Advanced performance monitoring with device capability detection,
 * battery monitoring, thermal throttling detection, GPU utilization,
 * and network performance tracking for the Phase 4 system.
 * 
 * Privacy-respecting design with no external analytics transmission.
 */

import { 
  PerformanceMetrics, 
  MemoryStats, 
  DeviceCapabilities,
  PerformanceAlert,
  PerformanceHints
} from '@/interfaces/BackgroundSystemV3';
import { 
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  ModuleId,
  PerformanceTimestamp,
  MemoryMB,
  createMemoryMB
} from '@/types/utilities';
import { DeviceCapabilityManager } from '@/utils/DeviceCapabilityManager';
import { TypeSafePerformanceMonitor } from '@/utils/TypeSafePerformanceMonitor';

// ============================================================================
// Extended Metrics Interfaces
// ============================================================================

interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  // GPU metrics
  gpuUtilization?: number; // 0-100%
  webglContextHealth: 'healthy' | 'warning' | 'lost' | 'unavailable';
  textureMemoryUsage?: number; // MB
  shaderCompileTime?: number; // ms
  
  // Battery and thermal
  batteryLevel?: number; // 0-1
  batteryCharging?: boolean;
  batteryTimeRemaining?: number; // minutes
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  
  // Network performance
  networkLatency?: number; // ms
  networkThroughput?: number; // KB/s
  resourceLoadingTime?: number; // ms
  
  // Interaction metrics
  inputLatency?: number; // ms
  gestureAccuracy?: number; // 0-1
  patternMatchingPerformance?: number; // matches/second
  
  // User experience metrics
  perceivedPerformance?: number; // 0-100 score
  visualQualityDegradation?: number; // 0-1
  accessibilityResponseTime?: number; // ms
}

interface InteractionMetrics {
  mouseLatency: number[];
  touchLatency: number[];
  keyboardLatency: number[];
  scrollLatency: number[];
  gestureRecognitionTime: number[];
}

interface NetworkMetrics {
  dns: number[];
  tcp: number[];
  ssl: number[];
  download: number[];
  resourceCount: number;
  totalSize: number; // bytes
}

interface GpuMetrics {
  contextCreationTime: number;
  shaderCompileTimes: number[];
  textureUploadTimes: number[];
  drawCallDuration: number[];
  memoryPressure: 'low' | 'medium' | 'high';
}

interface BatteryMetrics {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  estimatedImpact: number; // mAh/hour
}

interface ThermalMetrics {
  state: 'nominal' | 'fair' | 'serious' | 'critical';
  throttlingDetected: boolean;
  performanceReduction: number; // 0-1
  temperature?: number; // Celsius if available
}

// ============================================================================
// Metrics Collection Configuration
// ============================================================================

interface MetricsCollectionConfig {
  enableGpuMonitoring: boolean;
  enableBatteryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableThermalMonitoring: boolean;
  enableInteractionTracking: boolean;
  sampleRate: number; // Hz
  historySize: number; // number of samples to keep
  alertThresholds: {
    batteryDrainRate: number; // %/hour
    thermalThrottling: number; // performance reduction %
    inputLatency: number; // ms
    gpuMemoryUsage: number; // MB
    networkLatency: number; // ms
  };
}

const DEFAULT_METRICS_CONFIG: MetricsCollectionConfig = {
  enableGpuMonitoring: true,
  enableBatteryMonitoring: true,
  enableNetworkMonitoring: true,
  enableThermalMonitoring: true,
  enableInteractionTracking: true,
  sampleRate: 1, // 1 Hz
  historySize: 300, // 5 minutes
  alertThresholds: {
    batteryDrainRate: 20, // 20% per hour
    thermalThrottling: 15, // 15% performance reduction
    inputLatency: 100, // 100ms
    gpuMemoryUsage: 256, // 256MB
    networkLatency: 1000 // 1 second
  }
};

// ============================================================================
// Device Capability Enhanced Detection
// ============================================================================

class EnhancedDeviceCapabilityDetector {
  private static instance: EnhancedDeviceCapabilityDetector | null = null;
  private capabilities: DeviceCapabilities | null = null;
  private deviceManager: DeviceCapabilityManager;

  private constructor() {
    this.deviceManager = new DeviceCapabilityManager();
  }

  static getInstance(): EnhancedDeviceCapabilityDetector {
    if (!EnhancedDeviceCapabilityDetector.instance) {
      EnhancedDeviceCapabilityDetector.instance = new EnhancedDeviceCapabilityDetector();
    }
    return EnhancedDeviceCapabilityDetector.instance;
  }

  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities;

    const base = await this.deviceManager.getCapabilities();
    
    // Enhanced detection
    const enhanced: DeviceCapabilities = {
      ...base,
      // GPU capabilities
      maxTextureSize: this.detectMaxTextureSize(),
      maxRenderBufferSize: this.detectMaxRenderBufferSize(),
      supportedExtensions: this.detectWebGLExtensions(),
      
      // Memory estimation
      memoryLimit: this.estimateMemoryLimit(),
      
      // Device type detection
      isLowPower: this.detectLowPowerDevice(),
      isMobile: this.detectMobileDevice(),
      
      // Advanced capabilities
      supportsVR: this.detectVRSupport(),
      supportsAR: this.detectARSupport(),
      preferredColorSpace: this.detectColorSpaceSupport()
    };

    this.capabilities = enhanced;
    return enhanced;
  }

  private detectMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) return 1024;
      
      return gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024;
    } catch (error) {
      return 1024;
    }
  }

  private detectMaxRenderBufferSize(): number {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) return 1024;
      
      return gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 1024;
    } catch (error) {
      return 1024;
    }
  }

  private detectWebGLExtensions(): string[] {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) return [];
      
      return gl.getSupportedExtensions() || [];
    } catch (error) {
      return [];
    }
  }

  private estimateMemoryLimit(): number {
    // Estimate based on device characteristics
    const memory = (navigator as any).deviceMemory;
    if (memory) return memory * 1024; // GB to MB
    
    // Fallback estimation
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return userAgent.includes('iPhone') ? 3072 : 4096; // 3GB for iPhone, 4GB for iPad
    }
    
    if (userAgent.includes('Android')) {
      return 2048; // Conservative estimate for Android
    }
    
    return 8192; // Desktop default
  }

  private detectLowPowerDevice(): boolean {
    // Check for various indicators of low-power devices
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) return true;
    
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return true;
    
    const cores = navigator.hardwareConcurrency;
    if (cores && cores <= 2) return true;
    
    return false;
  }

  private detectMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectVRSupport(): boolean {
    return 'xr' in navigator || 'getVRDisplays' in navigator;
  }

  private detectARSupport(): boolean {
    return 'xr' in navigator; // WebXR supports both VR and AR
  }

  private detectColorSpaceSupport(): 'srgb' | 'p3' | 'rec2020' {
    if (window.matchMedia && window.matchMedia('(color-gamut: rec2020)').matches) {
      return 'rec2020';
    }
    if (window.matchMedia && window.matchMedia('(color-gamut: p3)').matches) {
      return 'p3';
    }
    return 'srgb';
  }
}

// ============================================================================
// GPU Monitoring
// ============================================================================

class GpuMonitor {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private extension: any = null;
  private metrics: GpuMetrics = {
    contextCreationTime: 0,
    shaderCompileTimes: [],
    textureUploadTimes: [],
    drawCallDuration: [],
    memoryPressure: 'low'
  };

  initialize(canvas: HTMLCanvasElement): boolean {
    try {
      this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!this.gl) return false;

      // Try to get GPU timing extension
      this.extension = this.gl.getExtension('EXT_disjoint_timer_query') ||
                      this.gl.getExtension('EXT_disjoint_timer_query_webgl2');

      return true;
    } catch (error) {
      console.warn('GPU monitoring initialization failed:', error);
      return false;
    }
  }

  measureShaderCompileTime(shaderSource: string, type: number): number {
    if (!this.gl) return 0;

    const start = performance.now();
    const shader = this.gl.createShader(type);
    if (!shader) return 0;

    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    
    const compileTime = performance.now() - start;
    this.metrics.shaderCompileTimes.push(compileTime);
    
    // Keep only recent measurements
    if (this.metrics.shaderCompileTimes.length > 50) {
      this.metrics.shaderCompileTimes = this.metrics.shaderCompileTimes.slice(-25);
    }

    this.gl.deleteShader(shader);
    return compileTime;
  }

  measureTextureUpload(width: number, height: number, data: ArrayBuffer): number {
    if (!this.gl) return 0;

    const start = performance.now();
    const texture = this.gl.createTexture();
    if (!texture) return 0;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, 
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(data)
    );
    
    const uploadTime = performance.now() - start;
    this.metrics.textureUploadTimes.push(uploadTime);
    
    // Keep only recent measurements
    if (this.metrics.textureUploadTimes.length > 50) {
      this.metrics.textureUploadTimes = this.metrics.textureUploadTimes.slice(-25);
    }

    this.gl.deleteTexture(texture);
    return uploadTime;
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' {
    // Estimate memory pressure based on texture upload performance
    const recentUploads = this.metrics.textureUploadTimes.slice(-10);
    if (recentUploads.length === 0) return 'low';

    const avgUploadTime = recentUploads.reduce((a, b) => a + b, 0) / recentUploads.length;
    
    if (avgUploadTime > 50) return 'high';
    if (avgUploadTime > 20) return 'medium';
    return 'low';
  }

  getContextHealth(): 'healthy' | 'warning' | 'lost' | 'unavailable' {
    if (!this.gl) return 'unavailable';
    
    if (this.gl.isContextLost()) return 'lost';
    
    // Check for warning signs
    const memoryPressure = this.getMemoryPressure();
    if (memoryPressure === 'high') return 'warning';
    
    return 'healthy';
  }

  getMetrics(): GpuMetrics {
    return { ...this.metrics, memoryPressure: this.getMemoryPressure() };
  }

  cleanup(): void {
    this.gl = null;
    this.extension = null;
    this.metrics = {
      contextCreationTime: 0,
      shaderCompileTimes: [],
      textureUploadTimes: [],
      drawCallDuration: [],
      memoryPressure: 'low'
    };
  }
}

// ============================================================================
// Battery Monitoring
// ============================================================================

class BatteryMonitor {
  private battery: any = null;
  private metrics: BatteryMetrics = {
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: 0,
    estimatedImpact: 0
  };
  private lastUpdate = 0;
  private powerHistory: Array<{ timestamp: number; level: number }> = [];

  async initialize(): Promise<boolean> {
    try {
      if ('getBattery' in navigator) {
        this.battery = await (navigator as any).getBattery();
        this.updateMetrics();
        this.setupEventListeners();
        return true;
      }
    } catch (error) {
      console.warn('Battery monitoring not available:', error);
    }
    return false;
  }

  private updateMetrics(): void {
    if (!this.battery) return;

    const now = Date.now();
    const previousLevel = this.metrics.level;
    
    this.metrics = {
      level: this.battery.level,
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      estimatedImpact: this.calculatePowerImpact()
    };

    // Track power history for drain calculation
    this.powerHistory.push({ timestamp: now, level: this.battery.level });
    
    // Keep only last hour of data
    const cutoff = now - (60 * 60 * 1000);
    this.powerHistory = this.powerHistory.filter(h => h.timestamp > cutoff);
    
    this.lastUpdate = now;
  }

  private calculatePowerImpact(): number {
    if (this.powerHistory.length < 2) return 0;
    
    const recent = this.powerHistory.slice(-5); // Last 5 readings
    if (recent.length < 2) return 0;
    
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const levelChange = recent[0].level - recent[recent.length - 1].level;
    
    if (timeSpan === 0 || levelChange <= 0) return 0;
    
    // Convert to percentage per hour
    return (levelChange / timeSpan) * (60 * 60 * 1000) * 100;
  }

  private setupEventListeners(): void {
    if (!this.battery) return;

    this.battery.addEventListener('levelchange', () => this.updateMetrics());
    this.battery.addEventListener('chargingchange', () => this.updateMetrics());
    this.battery.addEventListener('chargingtimechange', () => this.updateMetrics());
    this.battery.addEventListener('dischargingtimechange', () => this.updateMetrics());
  }

  getMetrics(): BatteryMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  isDraining(): boolean {
    return !this.metrics.charging && this.metrics.estimatedImpact > 0;
  }

  getDrainRate(): number {
    return this.metrics.estimatedImpact;
  }
}

// ============================================================================
// Thermal Monitoring
// ============================================================================

class ThermalMonitor {
  private metrics: ThermalMetrics = {
    state: 'nominal',
    throttlingDetected: false,
    performanceReduction: 0
  };
  private fpsHistory: number[] = [];
  private baselinePerformance: number = 60;

  updatePerformance(fps: number): void {
    this.fpsHistory.push(fps);
    
    // Keep last 30 seconds of data
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }

    // Update baseline in first 10 seconds
    if (this.fpsHistory.length <= 10) {
      this.baselinePerformance = Math.max(this.baselinePerformance, fps);
    }

    this.detectThermalThrottling();
  }

  private detectThermalThrottling(): void {
    if (this.fpsHistory.length < 10) return;

    const recentAverage = this.fpsHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const performanceReduction = Math.max(0, (this.baselinePerformance - recentAverage) / this.baselinePerformance);
    
    this.metrics.performanceReduction = performanceReduction;
    
    // Detect throttling
    if (performanceReduction > 0.3) { // 30% reduction
      this.metrics.state = 'critical';
      this.metrics.throttlingDetected = true;
    } else if (performanceReduction > 0.2) { // 20% reduction
      this.metrics.state = 'serious';
      this.metrics.throttlingDetected = true;
    } else if (performanceReduction > 0.1) { // 10% reduction
      this.metrics.state = 'fair';
      this.metrics.throttlingDetected = false;
    } else {
      this.metrics.state = 'nominal';
      this.metrics.throttlingDetected = false;
    }
  }

  getMetrics(): ThermalMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.fpsHistory = [];
    this.baselinePerformance = 60;
    this.metrics = {
      state: 'nominal',
      throttlingDetected: false,
      performanceReduction: 0
    };
  }
}

// ============================================================================
// Interaction Tracking
// ============================================================================

class InteractionTracker {
  private metrics: InteractionMetrics = {
    mouseLatency: [],
    touchLatency: [],
    keyboardLatency: [],
    scrollLatency: [],
    gestureRecognitionTime: []
  };
  private eventTimes = new Map<string, number>();

  initialize(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse tracking
    document.addEventListener('mousedown', (e) => {
      this.eventTimes.set(`mouse_${e.timeStamp}`, performance.now());
    });

    document.addEventListener('mouseup', (e) => {
      const key = `mouse_${e.timeStamp}`;
      const startTime = this.eventTimes.get(key);
      if (startTime) {
        const latency = performance.now() - startTime;
        this.metrics.mouseLatency.push(latency);
        this.eventTimes.delete(key);
        this.trimArray(this.metrics.mouseLatency);
      }
    });

    // Touch tracking
    document.addEventListener('touchstart', (e) => {
      this.eventTimes.set(`touch_${e.timeStamp}`, performance.now());
    });

    document.addEventListener('touchend', (e) => {
      const key = `touch_${e.timeStamp}`;
      const startTime = this.eventTimes.get(key);
      if (startTime) {
        const latency = performance.now() - startTime;
        this.metrics.touchLatency.push(latency);
        this.eventTimes.delete(key);
        this.trimArray(this.metrics.touchLatency);
      }
    });

    // Keyboard tracking
    document.addEventListener('keydown', (e) => {
      this.eventTimes.set(`key_${e.timeStamp}`, performance.now());
    });

    document.addEventListener('keyup', (e) => {
      const key = `key_${e.timeStamp}`;
      const startTime = this.eventTimes.get(key);
      if (startTime) {
        const latency = performance.now() - startTime;
        this.metrics.keyboardLatency.push(latency);
        this.eventTimes.delete(key);
        this.trimArray(this.metrics.keyboardLatency);
      }
    });

    // Scroll tracking
    let scrollStart = 0;
    document.addEventListener('scroll', () => {
      if (scrollStart === 0) {
        scrollStart = performance.now();
        requestAnimationFrame(() => {
          const latency = performance.now() - scrollStart;
          this.metrics.scrollLatency.push(latency);
          this.trimArray(this.metrics.scrollLatency);
          scrollStart = 0;
        });
      }
    });
  }

  private trimArray(arr: number[]): void {
    if (arr.length > 50) {
      arr.splice(0, arr.length - 25);
    }
  }

  recordGestureRecognitionTime(time: number): void {
    this.metrics.gestureRecognitionTime.push(time);
    this.trimArray(this.metrics.gestureRecognitionTime);
  }

  getMetrics(): InteractionMetrics {
    return {
      mouseLatency: [...this.metrics.mouseLatency],
      touchLatency: [...this.metrics.touchLatency],
      keyboardLatency: [...this.metrics.keyboardLatency],
      scrollLatency: [...this.metrics.scrollLatency],
      gestureRecognitionTime: [...this.metrics.gestureRecognitionTime]
    };
  }

  getAverageLatency(): number {
    const allLatencies = [
      ...this.metrics.mouseLatency,
      ...this.metrics.touchLatency,
      ...this.metrics.keyboardLatency,
      ...this.metrics.scrollLatency
    ];

    if (allLatencies.length === 0) return 0;
    return allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
  }

  cleanup(): void {
    // Event listeners are on document, so they'll be cleaned up when the page unloads
    this.metrics = {
      mouseLatency: [],
      touchLatency: [],
      keyboardLatency: [],
      scrollLatency: [],
      gestureRecognitionTime: []
    };
    this.eventTimes.clear();
  }
}

// ============================================================================
// Network Performance Monitoring
// ============================================================================

class NetworkMonitor {
  private metrics: NetworkMetrics = {
    dns: [],
    tcp: [],
    ssl: [],
    download: [],
    resourceCount: 0,
    totalSize: 0
  };
  private observer: PerformanceObserver | null = null;

  initialize(): boolean {
    try {
      if ('PerformanceObserver' in window) {
        this.observer = new PerformanceObserver((list) => {
          this.processPerformanceEntries(list.getEntries());
        });
        
        this.observer.observe({ entryTypes: ['resource', 'navigation'] });
        return true;
      }
    } catch (error) {
      console.warn('Network monitoring initialization failed:', error);
    }
    return false;
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'resource' || entry.entryType === 'navigation') {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // DNS timing
        if (resourceEntry.domainLookupEnd && resourceEntry.domainLookupStart) {
          const dnsTime = resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart;
          this.metrics.dns.push(dnsTime);
          this.trimArray(this.metrics.dns);
        }

        // TCP timing
        if (resourceEntry.connectEnd && resourceEntry.connectStart) {
          const tcpTime = resourceEntry.connectEnd - resourceEntry.connectStart;
          this.metrics.tcp.push(tcpTime);
          this.trimArray(this.metrics.tcp);
        }

        // SSL timing
        if (resourceEntry.secureConnectionStart && resourceEntry.connectEnd) {
          const sslTime = resourceEntry.connectEnd - resourceEntry.secureConnectionStart;
          this.metrics.ssl.push(sslTime);
          this.trimArray(this.metrics.ssl);
        }

        // Download timing
        if (resourceEntry.responseEnd && resourceEntry.responseStart) {
          const downloadTime = resourceEntry.responseEnd - resourceEntry.responseStart;
          this.metrics.download.push(downloadTime);
          this.trimArray(this.metrics.download);
        }

        // Resource size tracking
        if (resourceEntry.transferSize) {
          this.metrics.resourceCount++;
          this.metrics.totalSize += resourceEntry.transferSize;
        }
      }
    });
  }

  private trimArray(arr: number[]): void {
    if (arr.length > 50) {
      arr.splice(0, arr.length - 25);
    }
  }

  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  getAverageLatency(): number {
    const allTimes = [
      ...this.metrics.dns,
      ...this.metrics.tcp,
      ...this.metrics.ssl,
      ...this.metrics.download
    ];

    if (allTimes.length === 0) return 0;
    return allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
  }

  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.metrics = {
      dns: [],
      tcp: [],
      ssl: [],
      download: [],
      resourceCount: 0,
      totalSize: 0
    };
  }
}

// ============================================================================
// Main Comprehensive Metrics Collector
// ============================================================================

export class ComprehensiveMetricsCollector {
  private config: MetricsCollectionConfig;
  private baseMonitor: TypeSafePerformanceMonitor;
  private deviceDetector: EnhancedDeviceCapabilityDetector;
  private gpuMonitor: GpuMonitor;
  private batteryMonitor: BatteryMonitor;
  private thermalMonitor: ThermalMonitor;
  private interactionTracker: InteractionTracker;
  private networkMonitor: NetworkMonitor;
  
  private isInitialized = false;
  private isCollecting = false;
  private collectionInterval: number | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;

  constructor(config: Partial<MetricsCollectionConfig> = {}) {
    this.config = { ...DEFAULT_METRICS_CONFIG, ...config };
    this.baseMonitor = new TypeSafePerformanceMonitor();
    this.deviceDetector = EnhancedDeviceCapabilityDetector.getInstance();
    this.gpuMonitor = new GpuMonitor();
    this.batteryMonitor = new BatteryMonitor();
    this.thermalMonitor = new ThermalMonitor();
    this.interactionTracker = new InteractionTracker();
    this.networkMonitor = new NetworkMonitor();
  }

  async initialize(canvas?: HTMLCanvasElement): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Initialize device capabilities
      this.deviceCapabilities = await this.deviceDetector.detectCapabilities();
      
      // Initialize base performance monitor
      this.baseMonitor.startMonitoring();

      // Initialize specialized monitors based on config and capabilities
      if (this.config.enableGpuMonitoring && canvas && this.deviceCapabilities.webgl) {
        this.gpuMonitor.initialize(canvas);
      }

      if (this.config.enableBatteryMonitoring) {
        await this.batteryMonitor.initialize();
      }

      if (this.config.enableInteractionTracking) {
        this.interactionTracker.initialize();
      }

      if (this.config.enableNetworkMonitoring) {
        this.networkMonitor.initialize();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize comprehensive metrics collector:', error);
      return false;
    }
  }

  startCollection(): void {
    if (!this.isInitialized || this.isCollecting) return;

    this.isCollecting = true;
    const intervalMs = 1000 / this.config.sampleRate;
    
    this.collectionInterval = window.setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    
    if (this.collectionInterval !== null) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  private collectMetrics(): void {
    try {
      const baseMetrics = this.baseMonitor.getMetrics();
      
      // Update thermal monitoring with current FPS
      this.thermalMonitor.updatePerformance(baseMetrics.computedFPS);
      
      // Collect specialized metrics
      const gpuMetrics = this.gpuMonitor.getMetrics();
      const batteryMetrics = this.batteryMonitor.getMetrics();
      const thermalMetrics = this.thermalMonitor.getMetrics();
      const interactionMetrics = this.interactionTracker.getMetrics();
      const networkMetrics = this.networkMonitor.getMetrics();

      // Generate alerts if needed
      this.checkAlertConditions(baseMetrics, gpuMetrics, batteryMetrics, thermalMetrics, interactionMetrics, networkMetrics);
      
    } catch (error) {
      console.error('Error collecting comprehensive metrics:', error);
    }
  }

  private checkAlertConditions(
    base: EnhancedPerformanceMetrics,
    gpu: GpuMetrics,
    battery: BatteryMetrics,
    thermal: ThermalMetrics,
    interaction: InteractionMetrics,
    network: NetworkMetrics
  ): void {
    // Battery drain alert
    if (!battery.charging && battery.estimatedImpact > this.config.alertThresholds.batteryDrainRate) {
      console.warn(`🔋 High battery drain detected: ${battery.estimatedImpact.toFixed(1)}%/hour`);
    }

    // Thermal throttling alert
    if (thermal.throttlingDetected && thermal.performanceReduction > this.config.alertThresholds.thermalThrottling / 100) {
      console.warn(`🌡️ Thermal throttling detected: ${(thermal.performanceReduction * 100).toFixed(1)}% performance reduction`);
    }

    // Input latency alert
    const avgInputLatency = this.interactionTracker.getAverageLatency();
    if (avgInputLatency > this.config.alertThresholds.inputLatency) {
      console.warn(`🖱️ High input latency: ${avgInputLatency.toFixed(1)}ms`);
    }

    // Network latency alert
    const avgNetworkLatency = this.networkMonitor.getAverageLatency();
    if (avgNetworkLatency > this.config.alertThresholds.networkLatency) {
      console.warn(`🌐 High network latency: ${avgNetworkLatency.toFixed(1)}ms`);
    }

    // GPU memory pressure alert
    if (gpu.memoryPressure === 'high') {
      console.warn('🖥️ High GPU memory pressure detected');
    }
  }

  getComprehensiveMetrics(): ExtendedPerformanceMetrics {
    const baseMetrics = this.baseMonitor.getMetrics();
    const gpuMetrics = this.gpuMonitor.getMetrics();
    const batteryMetrics = this.batteryMonitor.getMetrics();
    const thermalMetrics = this.thermalMonitor.getMetrics();
    const interactionMetrics = this.interactionTracker.getMetrics();
    const networkMetrics = this.networkMonitor.getMetrics();

    return {
      ...baseMetrics,
      // GPU metrics
      webglContextHealth: this.gpuMonitor.getContextHealth(),
      
      // Battery and thermal
      batteryLevel: batteryMetrics.level,
      batteryCharging: batteryMetrics.charging,
      thermalState: thermalMetrics.state,
      
      // Network performance
      networkLatency: this.networkMonitor.getAverageLatency(),
      resourceLoadingTime: networkMetrics.download.length > 0 ? 
        networkMetrics.download.reduce((a, b) => a + b, 0) / networkMetrics.download.length : undefined,
      
      // Interaction metrics
      inputLatency: this.interactionTracker.getAverageLatency(),
      
      // User experience metrics
      perceivedPerformance: this.calculatePerceivedPerformance(baseMetrics, thermalMetrics, interactionMetrics),
      visualQualityDegradation: thermalMetrics.performanceReduction,
      accessibilityResponseTime: this.interactionTracker.getAverageLatency()
    };
  }

  private calculatePerceivedPerformance(
    base: EnhancedPerformanceMetrics,
    thermal: ThermalMetrics,
    interaction: InteractionMetrics
  ): number {
    // Weighted score combining FPS, thermal state, and interaction responsiveness
    const fpsScore = Math.min(100, (base.computedFPS / 60) * 100);
    const thermalScore = (1 - thermal.performanceReduction) * 100;
    const interactionScore = Math.max(0, 100 - (this.interactionTracker.getAverageLatency() / 10));

    return Math.round((fpsScore * 0.5) + (thermalScore * 0.3) + (interactionScore * 0.2));
  }

  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  updateConfiguration(newConfig: Partial<MetricsCollectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  recordGestureRecognitionTime(time: number): void {
    this.interactionTracker.recordGestureRecognitionTime(time);
  }

  cleanup(): void {
    this.stopCollection();
    this.baseMonitor.cleanup();
    this.gpuMonitor.cleanup();
    this.interactionTracker.cleanup();
    this.networkMonitor.cleanup();
    this.isInitialized = false;
  }
}

export default ComprehensiveMetricsCollector;