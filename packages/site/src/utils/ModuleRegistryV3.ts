import { 
  ModuleRegistryEntryV3, 
  ModuleCategory, 
  ModuleCapability, 
  ValidationResult,
  DeviceCapabilities,
  ModuleDependency
} from '../../../interfaces/BackgroundSystemV3'

/**
 * Enhanced module registry with dependency resolution and smart discovery
 */
export class ModuleRegistryV3 {
  private modules = new Map<string, ModuleRegistryEntryV3>()
  private categories = new Map<ModuleCategory, string[]>()
  private dependencyGraph = new Map<string, string[]>()
  private loadedModules = new Set<string>()

  /**
   * Register a new background module
   */
  async registerModule(module: ModuleRegistryEntryV3): Promise<void> {
    // Validate module structure
    const validation = this.validateModuleEntry(module)
    if (!validation.valid) {
      throw new Error(`Module validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // Check for conflicts
    this.checkModuleConflicts(module)

    // Resolve dependencies
    await this.resolveDependencies(module)

    // Register the module
    this.modules.set(module.id, module)
    this.updateCategoryIndex(module)
    this.updateDependencyGraph(module)

    console.log(`✅ Registered background module: ${module.name} (${module.id})`)
  }

  /**
   * Get a specific module by ID
   */
  getModule(moduleId: string): ModuleRegistryEntryV3 | undefined {
    return this.modules.get(moduleId)
  }

  /**
   * Get all registered modules
   */
  getAllModules(): Map<string, ModuleRegistryEntryV3> {
    return new Map(this.modules)
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: ModuleCategory): ModuleRegistryEntryV3[] {
    const moduleIds = this.categories.get(category) || []
    return moduleIds.map(id => this.modules.get(id)!).filter(Boolean)
  }

  /**
   * Discover modules based on criteria
   */
  discoverModules(criteria: {
    capabilities?: ModuleCapability[]
    category?: ModuleCategory
    maxMemoryMB?: number
    deviceCapabilities?: DeviceCapabilities
    tags?: string[]
  }): ModuleRegistryEntryV3[] {
    let candidates = Array.from(this.modules.values())

    // Filter by category
    if (criteria.category) {
      candidates = candidates.filter(module => module.category === criteria.category)
    }

    // Filter by capabilities
    if (criteria.capabilities && criteria.capabilities.length > 0) {
      candidates = candidates.filter(module => 
        criteria.capabilities!.every(cap => module.capabilities.includes(cap))
      )
    }

    // Filter by memory budget
    if (criteria.maxMemoryMB) {
      candidates = candidates.filter(module => module.memoryBudget <= criteria.maxMemoryMB!)
    }

    // Filter by device capabilities
    if (criteria.deviceCapabilities) {
      candidates = this.filterByDeviceCapabilities(candidates, criteria.deviceCapabilities)
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      candidates = candidates.filter(module =>
        criteria.tags!.some(tag => module.tags.includes(tag))
      )
    }

    // Sort by compatibility score
    return this.sortByCompatibilityScore(candidates, criteria)
  }

  /**
   * Get recommended modules for a device
   */
  getRecommendedModules(deviceCapabilities: DeviceCapabilities, maxCount = 5): ModuleRegistryEntryV3[] {
    const allModules = Array.from(this.modules.values())
    const compatible = this.filterByDeviceCapabilities(allModules, deviceCapabilities)
    const scored = this.sortByCompatibilityScore(compatible, { deviceCapabilities })
    
    return scored.slice(0, maxCount)
  }

  /**
   * Check if modules are compatible with each other
   */
  areModulesCompatible(moduleIds: string[]): { compatible: boolean; conflicts: string[] } {
    const conflicts: string[] = []
    
    for (let i = 0; i < moduleIds.length; i++) {
      const moduleA = this.modules.get(moduleIds[i])
      if (!moduleA) continue
      
      for (let j = i + 1; j < moduleIds.length; j++) {
        const moduleB = this.modules.get(moduleIds[j])
        if (!moduleB) continue
        
        // Check if modules conflict with each other
        if (moduleA.conflicts.includes(moduleB.id) || moduleB.conflicts.includes(moduleA.id)) {
          conflicts.push(`${moduleA.name} conflicts with ${moduleB.name}`)
        }
        
        // Check resource conflicts (simplified)
        if (moduleA.requiresWebGL && moduleB.requiresWebGL && 
            moduleA.cpuIntensity === 'high' && moduleB.cpuIntensity === 'high') {
          conflicts.push(`Both ${moduleA.name} and ${moduleB.name} are resource-intensive`)
        }
      }
    }
    
    return {
      compatible: conflicts.length === 0,
      conflicts
    }
  }

  /**
   * Get module loading order based on dependencies
   */
  getLoadingOrder(moduleIds: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []
    
    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return
      
      visited.add(moduleId)
      const dependencies = this.dependencyGraph.get(moduleId) || []
      
      // Visit dependencies first
      for (const depId of dependencies) {
        if (moduleIds.includes(depId)) {
          visit(depId)
        }
      }
      
      result.push(moduleId)
    }
    
    for (const moduleId of moduleIds) {
      visit(moduleId)
    }
    
    return result
  }

  /**
   * Preload a module without activating it
   */
  async preloadModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module ${moduleId} not found`)
    }

    if (this.loadedModules.has(moduleId)) {
      return // Already preloaded
    }

    try {
      if (module.preload) {
        await module.preload()
      }
      
      // Preload the module export
      await module.load()
      
      this.loadedModules.add(moduleId)
      console.log(`📦 Preloaded module: ${module.name}`)
    } catch (error) {
      console.error(`Failed to preload module ${moduleId}:`, error)
      
      // Try fallback if available
      if (module.fallback) {
        try {
          await module.fallback()
          this.loadedModules.add(moduleId)
          console.log(`📦 Preloaded fallback for module: ${module.name}`)
        } catch (fallbackError) {
          throw new Error(`Both primary and fallback loading failed for module ${moduleId}`)
        }
      } else {
        throw error
      }
    }
  }

  /**
   * Get module statistics
   */
  getStatistics() {
    const categories = new Map<ModuleCategory, number>()
    const capabilities = new Map<ModuleCapability, number>()
    let totalMemoryBudget = 0
    let webglRequiredCount = 0
    
    for (const module of this.modules.values()) {
      // Count categories
      categories.set(module.category, (categories.get(module.category) || 0) + 1)
      
      // Count capabilities
      for (const capability of module.capabilities) {
        capabilities.set(capability, (capabilities.get(capability) || 0) + 1)
      }
      
      // Sum memory budgets
      totalMemoryBudget += module.memoryBudget
      
      // Count WebGL requirements
      if (module.requiresWebGL) {
        webglRequiredCount++
      }
    }
    
    return {
      totalModules: this.modules.size,
      loadedModules: this.loadedModules.size,
      categories: Object.fromEntries(categories),
      capabilities: Object.fromEntries(capabilities),
      averageMemoryBudget: this.modules.size > 0 ? totalMemoryBudget / this.modules.size : 0,
      webglRequiredPercent: this.modules.size > 0 ? (webglRequiredCount / this.modules.size) * 100 : 0
    }
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId)
  }

  /**
   * Clear all loaded modules cache
   */
  clearLoadedModules(): void {
    this.loadedModules.clear()
  }

  private validateModuleEntry(module: ModuleRegistryEntryV3): ValidationResult {
    const errors: any[] = []
    
    // Required fields
    if (!module.id || typeof module.id !== 'string') {
      errors.push({ message: 'Module ID is required and must be a string', path: 'id' })
    }
    
    if (!module.name || typeof module.name !== 'string') {
      errors.push({ message: 'Module name is required and must be a string', path: 'name' })
    }
    
    if (!module.load || typeof module.load !== 'function') {
      errors.push({ message: 'Module load function is required', path: 'load' })
    }
    
    // Validate memory budget
    if (typeof module.memoryBudget !== 'number' || module.memoryBudget < 0) {
      errors.push({ message: 'Memory budget must be a positive number', path: 'memoryBudget' })
    }
    
    // Validate version format (basic semver check)
    if (module.version && !/^\d+\.\d+\.\d+/.test(module.version)) {
      errors.push({ message: 'Version must follow semantic versioning', path: 'version' })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private checkModuleConflicts(module: ModuleRegistryEntryV3): void {
    for (const conflictId of module.conflicts) {
      if (this.modules.has(conflictId)) {
        console.warn(`⚠️  Module ${module.id} conflicts with already registered module ${conflictId}`)
      }
    }
  }

  private async resolveDependencies(module: ModuleRegistryEntryV3): Promise<void> {
    for (const dependency of module.dependencies) {
      if (!this.modules.has(dependency.moduleId) && !dependency.optional) {
        throw new Error(`Required dependency ${dependency.moduleId} is not registered for module ${module.id}`)
      }
    }
  }

  private updateCategoryIndex(module: ModuleRegistryEntryV3): void {
    const categoryModules = this.categories.get(module.category) || []
    if (!categoryModules.includes(module.id)) {
      categoryModules.push(module.id)
      this.categories.set(module.category, categoryModules)
    }
  }

  private updateDependencyGraph(module: ModuleRegistryEntryV3): void {
    const dependencies = module.dependencies.map(dep => dep.moduleId)
    this.dependencyGraph.set(module.id, dependencies)
  }

  private filterByDeviceCapabilities(
    modules: ModuleRegistryEntryV3[], 
    capabilities: DeviceCapabilities
  ): ModuleRegistryEntryV3[] {
    return modules.filter(module => {
      // Check WebGL requirement
      if (module.requiresWebGL && !capabilities.webgl) {
        return false
      }
      
      // Check WebGL2 preference
      if (module.preferredCanvas === 'webgl2' && !capabilities.webgl2) {
        return false
      }
      
      // Check memory requirements
      if (module.memoryBudget > capabilities.deviceMemory * 1024 / 4) { // Use max 25% of device memory
        return false
      }
      
      // Check if high-intensity modules should be filtered on low-end devices
      if (capabilities.isLowEnd && module.cpuIntensity === 'high') {
        return false
      }
      
      return true
    })
  }

  private sortByCompatibilityScore(
    modules: ModuleRegistryEntryV3[], 
    criteria: any
  ): ModuleRegistryEntryV3[] {
    return modules.sort((a, b) => {
      const scoreA = this.calculateCompatibilityScore(a, criteria)
      const scoreB = this.calculateCompatibilityScore(b, criteria)
      return scoreB - scoreA // Higher score first
    })
  }

  private calculateCompatibilityScore(module: ModuleRegistryEntryV3, criteria: any): number {
    let score = 0
    
    // Base score
    score += 10
    
    // Category match bonus
    if (criteria.category && module.category === criteria.category) {
      score += 20
    }
    
    // Capability match bonus
    if (criteria.capabilities) {
      const matchingCaps = criteria.capabilities.filter((cap: ModuleCapability) => 
        module.capabilities.includes(cap)
      ).length
      score += matchingCaps * 5
    }
    
    // Device capability bonus/penalty
    if (criteria.deviceCapabilities) {
      const caps = criteria.deviceCapabilities
      
      // Prefer modules that match the device's preferred canvas type
      if (caps.webgl2 && module.preferredCanvas === 'webgl2') score += 15
      else if (caps.webgl && module.preferredCanvas === 'webgl') score += 10
      else if (!caps.webgl && module.preferredCanvas === 'canvas2d') score += 10
      
      // Penalty for mismatched intensity
      if (caps.isLowEnd && module.cpuIntensity === 'high') score -= 20
      if (caps.isMobile && module.cpuIntensity === 'high') score -= 10
      
      // Memory efficiency bonus
      if (caps.deviceMemory && module.memoryBudget < caps.deviceMemory * 100) { // Less than 100MB per GB of device memory
        score += 5
      }
    }
    
    // Tag match bonus
    if (criteria.tags) {
      const matchingTags = criteria.tags.filter((tag: string) => 
        module.tags.includes(tag)
      ).length
      score += matchingTags * 3
    }
    
    // Prefer already loaded modules for better performance
    if (this.loadedModules.has(module.id)) {
      score += 5
    }
    
    return score
  }

  /**
   * Cleanup and reset the registry
   */
  cleanup(): void {
    this.modules.clear()
    this.categories.clear()
    this.dependencyGraph.clear()
    this.loadedModules.clear()
  }
}
