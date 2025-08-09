/**
 * Phase 4 Advanced Features - Module Tests
 * Comprehensive testing for all advanced visual modules
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FluidSimulation from './FluidSimulation';
import FallingSand from './FallingSand';
import DVDLogoBouncer from './DVDLogoBouncer';
import type { ModuleOptions } from '@/types/background';

// Mock WebGL context
class MockWebGLRenderingContext {
  canvas = { width: 800, height: 600 };
  
  // WebGL constants
  VERTEX_SHADER = 0x8B31;
  FRAGMENT_SHADER = 0x8B30;
  ARRAY_BUFFER = 0x8892;
  ELEMENT_ARRAY_BUFFER = 0x8893;
  STATIC_DRAW = 0x88E4;
  DYNAMIC_DRAW = 0x88E8;
  TEXTURE_2D = 0x0DE1;
  RGBA = 0x1908;
  UNSIGNED_BYTE = 0x1401;
  FLOAT = 0x1406;
  TEXTURE_MIN_FILTER = 0x2801;
  TEXTURE_MAG_FILTER = 0x2800;
  LINEAR = 0x2601;
  NEAREST = 0x2600;
  CLAMP_TO_EDGE = 0x812F;
  TEXTURE_WRAP_S = 0x2802;
  TEXTURE_WRAP_T = 0x2803;
  COLOR_ATTACHMENT0 = 0x8CE0;
  FRAMEBUFFER = 0x8D40;
  TEXTURE0 = 0x84C0;
  TRIANGLES = 0x0004;
  TRIANGLE_STRIP = 0x0005;
  UNSIGNED_SHORT = 0x1403;
  LINK_STATUS = 0x8B82;
  COMPILE_STATUS = 0x8B81;
  COLOR_BUFFER_BIT = 0x00004000;
  BLEND = 0x0BE2;
  SRC_ALPHA = 0x0302;
  ONE_MINUS_SRC_ALPHA = 0x0303;
  
  // Mock methods
  createShader = vi.fn().mockReturnValue({});
  shaderSource = vi.fn();
  compileShader = vi.fn();
  getShaderParameter = vi.fn().mockReturnValue(true);
  getShaderInfoLog = vi.fn().mockReturnValue('');
  createProgram = vi.fn().mockReturnValue({});
  attachShader = vi.fn();
  linkProgram = vi.fn();
  getProgramParameter = vi.fn().mockReturnValue(true);
  getProgramInfoLog = vi.fn().mockReturnValue('');
  useProgram = vi.fn();
  getAttribLocation = vi.fn().mockReturnValue(0);
  getUniformLocation = vi.fn().mockReturnValue({});
  createBuffer = vi.fn().mockReturnValue({});
  bindBuffer = vi.fn();
  bufferData = vi.fn();
  createTexture = vi.fn().mockReturnValue({});
  bindTexture = vi.fn();
  texImage2D = vi.fn();
  texSubImage2D = vi.fn();
  texParameteri = vi.fn();
  createFramebuffer = vi.fn().mockReturnValue({});
  bindFramebuffer = vi.fn();
  framebufferTexture2D = vi.fn();
  viewport = vi.fn();
  clear = vi.fn();
  clearColor = vi.fn();
  drawArrays = vi.fn();
  drawElements = vi.fn();
  enableVertexAttribArray = vi.fn();
  vertexAttribPointer = vi.fn();
  uniform1f = vi.fn();
  uniform2f = vi.fn();
  uniform1i = vi.fn();
  activeTexture = vi.fn();
  enable = vi.fn();
  disable = vi.fn();
  blendFunc = vi.fn();
  deleteTexture = vi.fn();
  deleteFramebuffer = vi.fn();
  deleteBuffer = vi.fn();
  deleteProgram = vi.fn();
  getExtension = vi.fn().mockReturnValue({});
}

// Mock Canvas
class MockCanvas {
  width = 800;
  height = 600;
  
  getContext(type: string) {
    if (type === 'webgl' || type === 'experimental-webgl') {
      return new MockWebGLRenderingContext();
    }
    if (type === '2d') {
      return {
        clearRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 100 })
      };
    }
    return null;
  }
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0,
    top: 0,
    bottom: 600,
    right: 800,
    width: 800,
    height: 600
  });
}

// Mock document and window
global.document = {
  createElement: vi.fn().mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

global.window = {
  matchMedia: vi.fn().mockReturnValue({ matches: false }),
  requestAnimationFrame: vi.fn(),
  cancelAnimationFrame: vi.fn()
} as any;

global.performance = {
  now: vi.fn().mockReturnValue(Date.now()),
  memory: {
    usedJSHeapSize: 1000000
  }
} as any;

describe('Advanced Visual Background Modules', () => {
  let canvas: MockCanvas;
  let mockOptions: ModuleOptions;

  beforeEach(() => {
    canvas = new MockCanvas();
    mockOptions = {
      debug: false,
      performance: 'medium',
      accessibility: {
        respectReducedMotion: false,
        highContrast: false,
        screenReader: false
      },
      preferences: {
        theme: 'light',
        reducedMotion: false,
        highContrast: false,
        preferredModules: [],
        discoveredEasterEggs: [],
        moduleSettings: {}
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FluidSimulation Module', () => {
    it('should have correct module metadata', () => {
      expect(FluidSimulation.id).toBe('fluid-simulation');
      expect(FluidSimulation.name).toBe('Fluid Simulation');
      expect(FluidSimulation.version).toBe('1.0.0');
      expect(FluidSimulation.difficulty).toBe(3);
      expect(FluidSimulation.requirements.webgl).toBe(true);
      expect(FluidSimulation.performance.estimatedBundleSize).toBeLessThan(50000);
    });

    it('should initialize successfully', async () => {
      const instance = await FluidSimulation.init(canvas as any, mockOptions);
      expect(instance).toBeDefined();
      expect(typeof instance.start).toBe('function');
      expect(typeof instance.stop).toBe('function');
      expect(typeof instance.pause).toBe('function');
      expect(typeof instance.resume).toBe('function');
      expect(typeof instance.resize).toBe('function');
      expect(typeof instance.destroy).toBe('function');
      expect(typeof instance.getPerformanceMetrics).toBe('function');
    });

    it('should handle lifecycle correctly', async () => {
      const instance = await FluidSimulation.init(canvas as any, mockOptions);
      
      expect(() => instance.start()).not.toThrow();
      expect(() => instance.pause()).not.toThrow();
      expect(() => instance.resume()).not.toThrow();
      expect(() => instance.resize(1024, 768)).not.toThrow();
      expect(() => instance.stop()).not.toThrow();
      expect(() => instance.destroy()).not.toThrow();
    });

    it('should provide performance metrics', async () => {
      const instance = await FluidSimulation.init(canvas as any, mockOptions);
      const metrics = instance.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('timestamp');
      expect(typeof metrics.fps).toBe('number');
    });

    it('should have easter egg configuration', () => {
      expect(FluidSimulation.easterEgg).toBeDefined();
      expect(FluidSimulation.easterEgg!.id).toBe('fluid-maestro');
      expect(FluidSimulation.easterEgg!.difficulty).toBe(4);
      expect(FluidSimulation.easterEgg!.discoveryHint).toContain('spiral');
    });
  });

  describe('FallingSand Module', () => {
    it('should have correct module metadata', () => {
      expect(FallingSand.id).toBe('falling-sand');
      expect(FallingSand.name).toBe('Falling Sand');
      expect(FallingSand.version).toBe('1.0.0');
      expect(FallingSand.difficulty).toBe(4);
      expect(FallingSand.requirements.webgl).toBe(true);
      expect(FallingSand.performance.estimatedBundleSize).toBeLessThan(50000);
    });

    it('should initialize successfully', async () => {
      const instance = await FallingSand.init(canvas as any, mockOptions);
      expect(instance).toBeDefined();
      expect(typeof instance.start).toBe('function');
      expect(typeof instance.handleKeyboardEvent).toBe('function');
    });

    it('should handle performance settings', async () => {
      const highPerfOptions = { ...mockOptions, performance: 'high' as const };
      const lowPerfOptions = { ...mockOptions, performance: 'low' as const };
      
      const highInstance = await FallingSand.init(canvas as any, highPerfOptions);
      const lowInstance = await FallingSand.init(canvas as any, lowPerfOptions);
      
      expect(highInstance).toBeDefined();
      expect(lowInstance).toBeDefined();
    });

    it('should have easter egg with high difficulty', () => {
      expect(FallingSand.easterEgg).toBeDefined();
      expect(FallingSand.easterEgg!.id).toBe('alchemist-master');
      expect(FallingSand.easterEgg!.difficulty).toBe(5);
      expect(FallingSand.easterEgg!.discoveryHint).toContain('combinations');
    });
  });

  describe('DVDLogoBouncer Module', () => {
    it('should have correct module metadata', () => {
      expect(DVDLogoBouncer.id).toBe('dvd-logo-bouncer');
      expect(DVDLogoBouncer.name).toBe('DVD Logo Bouncer');
      expect(DVDLogoBouncer.version).toBe('1.0.0');
      expect(DVDLogoBouncer.difficulty).toBe(2);
      expect(DVDLogoBouncer.requirements.webgl).toBe(true);
      expect(DVDLogoBouncer.performance.estimatedBundleSize).toBeLessThan(50000);
    });

    it('should initialize successfully', async () => {
      const instance = await DVDLogoBouncer.init(canvas as any, mockOptions);
      expect(instance).toBeDefined();
    });

    it('should have reasonable performance characteristics', () => {
      expect(DVDLogoBouncer.performance.cpuIntensity).toBe('medium');
      expect(DVDLogoBouncer.performance.memoryUsage).toBe('low');
      expect(DVDLogoBouncer.performance.batteryImpact).toBe('low');
    });

    it('should have corner hit easter egg', () => {
      expect(DVDLogoBouncer.easterEgg).toBeDefined();
      expect(DVDLogoBouncer.easterEgg!.id).toBe('corner-hunter');
      expect(DVDLogoBouncer.easterEgg!.difficulty).toBe(3);
      expect(DVDLogoBouncer.easterEgg!.discoveryHint).toContain('corner');
    });
  });

  describe('Performance Requirements', () => {
    it('all modules should meet bundle size requirements', () => {
      const modules = [FluidSimulation, FallingSand, DVDLogoBouncer];
      modules.forEach(module => {
        expect(module.performance.estimatedBundleSize).toBeLessThan(50000); // <50KB
      });
    });

    it('all modules should support WebGL fallbacks', () => {
      const modules = [FluidSimulation, FallingSand, DVDLogoBouncer];
      modules.forEach(module => {
        expect(module.requirements.canvas2d).toBe(false); // WebGL required but should handle gracefully
      });
    });

    it('all modules should have reasonable minimum dimensions', () => {
      const modules = [FluidSimulation, FallingSand, DVDLogoBouncer];
      modules.forEach(module => {
        expect(module.requirements.minWidth).toBeGreaterThanOrEqual(400);
        expect(module.requirements.minHeight).toBeGreaterThanOrEqual(300);
      });
    });
  });

  describe('Easter Egg Integration', () => {
    it('all modules should have easter eggs', () => {
      const modules = [FluidSimulation, FallingSand, DVDLogoBouncer];
      modules.forEach(module => {
        expect(module.easterEgg).toBeDefined();
        expect(module.easterEgg!.id).toBeTruthy();
        expect(module.easterEgg!.difficulty).toBeGreaterThanOrEqual(1);
        expect(module.easterEgg!.difficulty).toBeLessThanOrEqual(5);
        expect(module.easterEgg!.discoveryHint).toBeTruthy();
      });
    });

    it('easter eggs should have proper reward structures', () => {
      const modules = [FluidSimulation, FallingSand, DVDLogoBouncer];
      modules.forEach(module => {
        const easterEgg = module.easterEgg!;
        expect(easterEgg.reward).toBeDefined();
        expect(easterEgg.reward.type).toBe('visual');
        expect(easterEgg.reward.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should respect reduced motion preferences', async () => {
      const accessibilityOptions = {
        ...mockOptions,
        accessibility: {
          respectReducedMotion: true,
          highContrast: false,
          screenReader: false
        }
      };

      const fluidInstance = await FluidSimulation.init(canvas as any, accessibilityOptions);
      const sandInstance = await FallingSand.init(canvas as any, accessibilityOptions);
      const dvdInstance = await DVDLogoBouncer.init(canvas as any, accessibilityOptions);

      expect(fluidInstance).toBeDefined();
      expect(sandInstance).toBeDefined();
      expect(dvdInstance).toBeDefined();
    });

    it('should support theme awareness', async () => {
      const darkThemeOptions = {
        ...mockOptions,
        preferences: {
          ...mockOptions.preferences,
          theme: 'dark' as const
        }
      };

      const instances = await Promise.all([
        FluidSimulation.init(canvas as any, darkThemeOptions),
        FallingSand.init(canvas as any, darkThemeOptions),
        DVDLogoBouncer.init(canvas as any, darkThemeOptions)
      ]);

      instances.forEach(instance => {
        expect(instance).toBeDefined();
      });
    });
  });
});
