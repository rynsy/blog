import { DeviceCapabilities, WebGLCapabilities, ModuleConfiguration, QualityPreset } from '../interfaces/BackgroundSystemV3'

/**
 * Manages device capability detection and performance optimization
 * Provides adaptive configuration based on device characteristics
 */
export class DeviceCapabilityManager {
  private capabilities: DeviceCapabilities | null = null
  private readonly MIN_MEMORY_FOR_HIGH_QUALITY = 8 // GB
  private readonly MIN_CORES_FOR_HIGH_QUALITY = 4
  private readonly MOBILE_USER_AGENTS = [
    'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Windows Phone'
  ]

  constructor() {
    this.detectCapabilities()
  }

  /**
   * Get detected device capabilities
   */
  getCapabilities(): DeviceCapabilities {
    if (!this.capabilities) {
      this.detectCapabilities()
    }
    return this.capabilities!
  }

  /**
   * Get optimal module configuration based on device capabilities
   */
  getOptimalConfiguration(defaultConfig: ModuleConfiguration): ModuleConfiguration {
    const capabilities = this.getCapabilities()
    const optimizedConfig = { ...defaultConfig }

    // Adjust quality based on device capabilities
    if (capabilities.isLowEnd) {
      optimizedConfig.quality = 'low'
      optimizedConfig.animationSpeed = (optimizedConfig.animationSpeed || 1) * 0.5
    } else if (capabilities.isMobile) {
      optimizedConfig.quality = 'medium'
      optimizedConfig.animationSpeed = (optimizedConfig.animationSpeed || 1) * 0.75
    }

    // Adjust physics settings based on CPU capability
    if (optimizedConfig.physics) {
      if (capabilities.hardwareConcurrency < 4) {
        optimizedConfig.physics.enabled = false
      } else if (capabilities.isLowEnd) {
        optimizedConfig.physics.gravity *= 0.5
        optimizedConfig.physics.damping *= 1.5
        optimizedConfig.physics.collisionDetection = false
      }
    }

    // Disable expensive interactions on low-end devices
    if (optimizedConfig.interactions && capabilities.isLowEnd) {
      optimizedConfig.interactions.enableHover = false
      optimizedConfig.interactions.clickToCreate = false
    }

    return optimizedConfig
  }

  /**
   * Get recommended quality preset for the device
   */
  getRecommendedQuality(): 'low' | 'medium' | 'high' {
    const capabilities = this.getCapabilities()

    if (capabilities.isLowEnd) {
      return 'low'
    }

    if (capabilities.isMobile) {
      return 'medium'
    }

    if (capabilities.deviceMemory >= this.MIN_MEMORY_FOR_HIGH_QUALITY &&
        capabilities.hardwareConcurrency >= this.MIN_CORES_FOR_HIGH_QUALITY &&
        capabilities.webgl2) {
      return 'high'
    }

    return 'medium'
  }

  /**
   * Check if device supports a specific feature
   */
  supportsFeature(feature: string): boolean {
    const capabilities = this.getCapabilities()

    switch (feature) {
      case 'webgl':
        return capabilities.webgl
      case 'webgl2':
        return capabilities.webgl2
      case 'offscreenCanvas':
        return capabilities.offscreenCanvas
      case 'highDPI':
        return window.devicePixelRatio > 1
      case 'touch':
        return 'ontouchstart' in window
      case 'gamepads':
        return 'getGamepads' in navigator
      case 'deviceMemory':
        return 'deviceMemory' in navigator
      case 'hardwareConcurrency':
        return 'hardwareConcurrency' in navigator
      case 'battery':
        return 'getBattery' in navigator
      default:
        return false
    }
  }

  /**
   * Get maximum recommended node count for interactive graphs
   */
  getMaxRecommendedNodes(): number {
    const capabilities = this.getCapabilities()

    if (capabilities.isLowEnd) {
      return 25
    }

    if (capabilities.isMobile) {
      return 50
    }

    if (capabilities.webgl2 && capabilities.deviceMemory >= 8) {
      return 200
    }

    if (capabilities.webgl) {
      return 100
    }

    return 50
  }

  /**
   * Get recommended target FPS based on device capabilities
   */
  getRecommendedFPS(): number {
    const capabilities = this.getCapabilities()

    if (capabilities.isLowEnd) {
      return 30
    }

    if (capabilities.isMobile && capabilities.batteryLevel && capabilities.batteryLevel < 0.2) {
      return 30 // Reduce FPS when battery is low
    }

    return 60
  }

  /**
   * Check if device should use reduced motion
   */
  shouldUseReducedMotion(): boolean {
    if (typeof window === 'undefined') return false

    // Check user preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      return true
    }

    // Check device capabilities
    const capabilities = this.getCapabilities()
    if (capabilities.isLowEnd) {
      return true
    }

    // Check battery level
    if (capabilities.batteryLevel && capabilities.batteryLevel < 0.15) {
      return true
    }

    return false
  }

  /**
   * Monitor device capabilities changes (battery, network, etc.)
   */
  startMonitoring(callback?: (capabilities: DeviceCapabilities) => void): void {
    // Monitor battery changes
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          if (this.capabilities) {
            this.capabilities.batteryLevel = battery.level
            this.capabilities.isCharging = battery.charging
            callback?.(this.capabilities)
          }
        }

        battery.addEventListener('levelchange', updateBattery)
        battery.addEventListener('chargingchange', updateBattery)
      }).catch(() => {
        // Battery API not supported
      })
    }

    // Monitor connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const updateConnection = () => {
        if (this.capabilities) {
          this.capabilities.networkSpeed = this.getNetworkSpeed(connection)
          callback?.(this.capabilities)
        }
      }

      connection.addEventListener('change', updateConnection)
    }

    // Monitor media query changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', () => {
      callback?.(this.getCapabilities())
    })
  }

  private detectCapabilities(): void {
    if (typeof window === 'undefined') {
      this.capabilities = this.getDefaultCapabilities()
      return
    }

    this.capabilities = {
      webgl: this.detectWebGL(),
      webgl2: this.detectWebGL2(),
      offscreenCanvas: this.detectOffscreenCanvas(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: this.getHardwareConcurrency(),
      isMobile: this.detectMobile(),
      isLowEnd: false, // Will be calculated after other properties
      supportedFormats: {
        webp: this.detectWebP(),
        avif: this.detectAVIF(),
        webgl: this.detectWebGLCapabilities()
      },
      networkSpeed: this.detectNetworkSpeed(),
      batteryLevel: undefined,
      isCharging: undefined
    }

    // Calculate if device is low-end based on multiple factors
    this.capabilities.isLowEnd = this.calculateLowEndDevice()

    // Get battery info asynchronously
    this.detectBatteryInfo()
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  }

  private detectWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!canvas.getContext('webgl2')
    } catch {
      return false
    }
  }

  private detectOffscreenCanvas(): boolean {
    return typeof OffscreenCanvas !== 'undefined'
  }

  private getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 4 // Default to 4GB if unknown
  }

  private getHardwareConcurrency(): number {
    return navigator.hardwareConcurrency || 4 // Default to 4 cores if unknown
  }

  private detectMobile(): boolean {
    const userAgent = navigator.userAgent
    return this.MOBILE_USER_AGENTS.some(mobile => userAgent.includes(mobile)) ||
           /Mobi|Android/i.test(userAgent)
  }

  private detectWebP(): boolean {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  private detectAVIF(): boolean {
    // Simple AVIF detection - more sophisticated methods exist
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  }

  private detectWebGLCapabilities(): WebGLCapabilities {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext

    if (!gl) {
      return {
        maxTextureSize: 0,
        maxViewportDims: [0, 0],
        maxVertexAttribs: 0,
        maxVaryingVectors: 0,
        maxFragmentUniforms: 0,
        extensions: []
      }
    }

    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      extensions: gl.getSupportedExtensions() || []
    }
  }

  private detectNetworkSpeed(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (!connection) {
      return 'medium' // Default assumption
    }

    return this.getNetworkSpeed(connection)
  }

  private getNetworkSpeed(connection: any): 'slow' | 'medium' | 'fast' {
    // Use effective connection type if available
    if (connection.effectiveType) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow'
        case '3g':
          return 'medium'
        case '4g':
          return 'fast'
        default:
          return 'medium'
      }
    }

    // Fallback to downlink speed
    if (connection.downlink) {
      if (connection.downlink < 1) return 'slow'
      if (connection.downlink < 5) return 'medium'
      return 'fast'
    }

    return 'medium'
  }

  private calculateLowEndDevice(): boolean {
    if (!this.capabilities) return false

    const {
      deviceMemory,
      hardwareConcurrency,
      isMobile,
      webgl,
      networkSpeed
    } = this.capabilities

    // Consider device low-end if any of these conditions are true:
    return (
      deviceMemory < 4 || // Less than 4GB RAM
      hardwareConcurrency < 4 || // Less than 4 CPU cores
      !webgl || // No WebGL support
      (isMobile && networkSpeed === 'slow') || // Slow mobile connection
      (isMobile && deviceMemory < 3) // Mobile with very low RAM
    )
  }

  private async detectBatteryInfo(): Promise<void> {
    if (!('getBattery' in navigator)) return

    try {
      const battery = await (navigator as any).getBattery()
      if (this.capabilities) {
        this.capabilities.batteryLevel = battery.level
        this.capabilities.isCharging = battery.charging
      }
    } catch {
      // Battery API not supported or denied
    }
  }

  private getDefaultCapabilities(): DeviceCapabilities {
    return {
      webgl: false,
      webgl2: false,
      offscreenCanvas: false,
      deviceMemory: 4,
      hardwareConcurrency: 4,
      isMobile: false,
      isLowEnd: false,
      supportedFormats: {
        webp: false,
        avif: false,
        webgl: {
          maxTextureSize: 0,
          maxViewportDims: [0, 0],
          maxVertexAttribs: 0,
          maxVaryingVectors: 0,
          maxFragmentUniforms: 0,
          extensions: []
        }
      },
      networkSpeed: 'medium'
    }
  }
}
