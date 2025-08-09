/**
 * Phase 4 Advanced Features - Background System Type Definitions
 * Comprehensive TypeScript interfaces for multi-agent coordination
 */

// Core background system interfaces
export interface BackgroundModule {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  
  // Performance characteristics
  performance: {
    cpuIntensity: 'low' | 'medium' | 'high';
    memoryUsage: 'low' | 'medium' | 'high';
    batteryImpact: 'low' | 'medium' | 'high';
    estimatedBundleSize: number; // in bytes
  };
  
  // Capabilities and requirements
  requirements: {
    webgl: boolean;
    canvas2d: boolean;
    devicePixelRatio: number;
    minWidth: number;
    minHeight: number;
  };
  
  // Module lifecycle
  init: (canvas: HTMLCanvasElement, options: ModuleOptions) => Promise<ModuleInstance>;
  cleanup?: () => void;
  
  // Easter egg integration
  easterEgg?: EasterEggConfig;
  
  // Community features
  communityData?: CommunityModuleData;
}

export interface ModuleInstance {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  resize: (width: number, height: number) => void;
  
  // Performance monitoring
  getPerformanceMetrics: () => PerformanceMetrics;
  
  // Easter egg interaction
  handleEasterEggEvent?: (event: EasterEggEvent) => void;
  
  // User interaction
  handleMouseEvent?: (event: MouseEvent) => void;
  handleKeyboardEvent?: (event: KeyboardEvent) => void;
  handleTouchEvent?: (event: TouchEvent) => void;
  
  // Cleanup
  destroy: () => void;
}

export interface ModuleOptions {
  debug: boolean;
  performance: 'low' | 'medium' | 'high';
  accessibility: {
    respectReducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
  preferences: UserPreferences;
}

// Easter egg system
export interface EasterEggConfig {
  id: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  triggers: EasterEggTrigger[];
  reward: EasterEggReward;
  discoveryHint?: string;
  requirements?: {
    moduleActive: string[];
    timeActive: number; // milliseconds
    interactions: number;
  };
}

export interface EasterEggTrigger {
  type: 'sequence' | 'pattern' | 'time' | 'interaction' | 'combination';
  data: unknown;
  tolerance?: number; // for pattern matching
}

export interface EasterEggEvent {
  type: string;
  data: unknown;
  timestamp: number;
  moduleId: string;
}

export interface EasterEggReward {
  type: 'visual' | 'audio' | 'module' | 'message' | 'achievement';
  content: unknown;
  duration?: number;
}

// Performance monitoring
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  batteryLevel?: number; // if available
  renderTime: number; // milliseconds
  timestamp: number;
}

export interface PerformanceBudget {
  maxBundleSize: number; // bytes
  minFPS: number;
  maxMemoryUsage: number; // MB
  maxCPUUsage: number; // percentage
}

// Advanced visual modules
export interface FluidSimulationConfig {
  viscosity: number;
  density: number;
  pressure: number;
  velocityDamping: number;
  colorDiffusion: number;
  iterations: number;
  gridResolution: number;
  darkMode?: boolean;
}

export interface FallingSandConfig {
  cellSize: number;
  gravity: number;
  elements: SandElement[];
  interactions: ElementInteraction[];
  windForce?: number;
  darkMode?: boolean;
}

export interface SandElement {
  id: string;
  name: string;
  color: string;
  density: number;
  behavior: 'solid' | 'liquid' | 'gas' | 'powder';
  temperature?: {
    melting: number;
    boiling: number;
    combustion: number;
  };
}

export interface ElementInteraction {
  element1: string;
  element2: string;
  result: string[];
  probability: number;
  conditions?: {
    temperature?: number;
    pressure?: number;
  };
}

export interface DVDLogoConfig {
  logos: DVDLogo[];
  physics: {
    speed: number;
    bounce: number;
    gravity: number;
  };
  colors: string[];
  colorChangeOnBounce: boolean;
}

export interface DVDLogo {
  id: string;
  texture: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  color: string;
}

// Community features
export interface CommunityModuleData {
  submittedBy: string;
  submissionDate: Date;
  downloads: number;
  rating: number;
  reviews: ModuleReview[];
  verified: boolean;
  flagged: boolean;
}

export interface ModuleReview {
  user: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

export interface ModuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  performanceImpact: {
    bundleSize: number;
    estimatedCPU: 'low' | 'medium' | 'high';
    estimatedMemory: 'low' | 'medium' | 'high';
  };
  securityRisk: 'low' | 'medium' | 'high';
}

// User preferences and state
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  preferredModules: string[];
  discoveredEasterEggs: string[];
  moduleSettings: Record<string, unknown>;
}

export interface BackgroundState {
  activeModule: string | null;
  availableModules: BackgroundModule[];
  isLoading: boolean;
  error: string | null;
  performance: PerformanceMetrics;
  easterEggs: {
    discovered: string[];
    inProgress: string[];
    available: string[];
  };
  userPreferences: UserPreferences;
}

// Context and provider interfaces
export interface BackgroundContextValue {
  state: BackgroundState;
  actions: BackgroundActions;
}

export interface BackgroundActions {
  // Module management
  switchModule: (moduleId: string) => Promise<void>;
  loadModule: (moduleId: string) => Promise<void>;
  unloadModule: (moduleId: string) => void;
  
  // Easter egg system
  triggerEasterEggCheck: (event: EasterEggEvent) => void;
  resetEasterEggProgress: (easterEggId: string) => void;
  
  // Performance
  setPerformanceMode: (mode: 'low' | 'medium' | 'high') => void;
  getPerformanceMetrics: () => PerformanceMetrics;
  
  // User preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Community features
  submitModule: (module: BackgroundModule) => Promise<ModuleValidationResult>;
  rateModule: (moduleId: string, rating: number, review?: string) => Promise<void>;
  reportModule: (moduleId: string, reason: string) => Promise<void>;
}

// Utility types
export type ModuleCategory = 
  | 'visualization' 
  | 'simulation' 
  | 'interactive' 
  | 'artistic' 
  | 'utility' 
  | 'experimental'
  | 'community';

export type PerformanceLevel = 'low' | 'medium' | 'high';

export type AccessibilityFeature = 
  | 'screen-reader'
  | 'high-contrast'
  | 'reduced-motion'
  | 'keyboard-navigation'
  | 'focus-indicators';

// WebGL and Canvas types
export interface WebGLCapabilities {
  supported: boolean;
  version: string;
  extensions: string[];
  maxTextureSize: number;
  maxVertexAttributes: number;
}

export interface CanvasContext {
  type: 'webgl' | 'webgl2' | '2d';
  context: WebGLRenderingContext | WebGL2RenderingContext | CanvasRenderingContext2D;
  capabilities: WebGLCapabilities | null;
}

// Analytics and monitoring
export interface AnalyticsEvent {
  type: 'module-switch' | 'easter-egg-discovered' | 'performance-issue' | 'error';
  data: unknown;
  timestamp: number;
  userId?: string; // anonymized
}

export interface PerformanceAlert {
  type: 'fps-drop' | 'memory-leak' | 'cpu-spike' | 'battery-drain';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

// Multi-agent coordination types
export interface CoordinationContext {
  activeAgents: string[];
  currentPhase: string;
  dependencies: Record<string, string[]>;
  completedTasks: string[];
  blockedTasks: string[];
  performanceImpact: {
    bundleSizeIncrease: number;
    memoryIncrease: number;
    cpuIncrease: number;
  };
}

export interface AgentDeliverable {
  agent: string;
  deliverable: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  dependencies: string[];
  performanceImpact: number; // KB
  accessibilityCompliant: boolean;
  estimatedCompletion: Date;
}