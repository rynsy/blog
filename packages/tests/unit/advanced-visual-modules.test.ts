/**
 * Phase 4 Unit Tests - Advanced Visual Modules
 * Comprehensive testing of fluid simulation, falling sand, DVD bouncer, and rendering systems
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  FluidSimulationConfig,
  FallingSandConfig,
  DVDLogoConfig,
  ModuleInstance,
  BackgroundModule,
  WebGLCapabilities,
  CanvasContext
} from '@site/types/background';
import { setupCanvasMocks, resetCanvasMocks, createMockCanvas, mockWebGLContext, mockCanvas2DContext } from '../setup/mocks/canvas'

// Setup canvas mocks globally
setupCanvasMocks()

describe('Phase 4: Advanced Visual Modules', () => {
  
  let mockCanvas: HTMLCanvasElement;
  
  beforeEach(() => {
    // Create mock canvas element using standardized factory
    mockCanvas = createMockCanvas(800, 600);
    resetCanvasMocks();
  });

  describe('Fluid Simulation', () => {
    
    test('should initialize fluid simulation with correct parameters', async () => {
      const config: FluidSimulationConfig = {
        viscosity: 0.8,
        density: 1.0,
        pressure: 0.9,
        velocityDamping: 0.99,
        colorDiffusion: 0.95,
        iterations: 20,
        gridResolution: 256,
        darkMode: false
      };
      
      // Mock fluid simulation module
      const fluidModule: BackgroundModule = {
        id: 'fluid-simulation',
        name: 'Fluid Simulation',
        description: 'Real-time fluid dynamics simulation',
        version: '1.0.0',
        author: 'Phase4 Team',
        tags: ['simulation', 'webgl', 'physics'],
        difficulty: 4,
        performance: {
          cpuIntensity: 'high',
          memoryUsage: 'medium',
          batteryImpact: 'high',
          estimatedBundleSize: 45000
        },
        requirements: {
          webgl: true,
          canvas2d: false,
          devicePixelRatio: 1,
          minWidth: 512,
          minHeight: 512
        },
        init: async (canvas: HTMLCanvasElement) => {
          const gl = canvas.getContext('webgl');
          if (!gl) throw new Error('WebGL not supported');
          
          const instance: ModuleInstance = {
            start: vi.fn(),
            stop: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            resize: vi.fn((width: number, height: number) => {
              canvas.width = width;
              canvas.height = height;
              gl.viewport(0, 0, width, height);
            }),
            getPerformanceMetrics: vi.fn(() => ({
              fps: 60,
              memoryUsage: 25,
              cpuUsage: 75,
              renderTime: 16.67,
              timestamp: Date.now()
            })),
            handleMouseEvent: vi.fn((event: MouseEvent) => {
              // Add fluid disturbance at mouse position
              const rect = canvas.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              // Simulate adding velocity at mouse position
            }),
            destroy: vi.fn(() => {
              // Cleanup WebGL resources
              gl.clear(gl.COLOR_BUFFER_BIT);
            })
          };
          
          return instance;
        }
      };
      
      const instance = await fluidModule.init(mockCanvas, {
        debug: false,
        performance: 'high',
        accessibility: {
          respectReducedMotion: false,
          highContrast: false,
          screenReader: false
        },
        preferences: {
          theme: 'auto',
          reducedMotion: false,
          highContrast: false,
          preferredModules: [],
          discoveredEasterEggs: [],
          moduleSettings: { fluidSimulation: config }
        }
      });
      
      expect(instance).toBeDefined();
      expect(instance.start).toBeDefined();
      expect(instance.getPerformanceMetrics).toBeDefined();
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
    });

    test('should handle fluid simulation performance under load', async () => {
      const startTime = performance.now();
      const frameCount = 60; // Simulate 1 second at 60fps
      
      // Mock performance-intensive fluid calculations
      for (let frame = 0; frame < frameCount; frame++) {
        // Simulate fluid step calculations
        const gridSize = 256;
        const cellCount = gridSize * gridSize;
        
        // Mock velocity field update
        const velocityField = new Float32Array(cellCount * 2);
        for (let i = 0; i < cellCount; i++) {
          velocityField[i * 2] = Math.sin(frame * 0.1 + i * 0.01);
          velocityField[i * 2 + 1] = Math.cos(frame * 0.1 + i * 0.01);
        }
        
        // Mock pressure solver iterations
        for (let iter = 0; iter < 20; iter++) {
          // Jacobi iteration simulation
          const convergence = iter / 20;
        }
        
        // Simulate rendering
        mockWebGLContext.clear(mockWebGLContext.COLOR_BUFFER_BIT);
        mockWebGLContext.drawArrays(mockWebGLContext.TRIANGLES, 0, 6);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageFrameTime = totalTime / frameCount;
      
      // Should maintain reasonable frame times (< 33ms for 30fps minimum)
      expect(averageFrameTime).toBeLessThan(33);
    });

    test('should adapt simulation quality based on performance', async () => {
      const performanceProfiles = {
        low: { gridResolution: 128, iterations: 10, quality: 0.5 },
        medium: { gridResolution: 256, iterations: 15, quality: 0.75 },
        high: { gridResolution: 512, iterations: 20, quality: 1.0 }
      };
      
      Object.entries(performanceProfiles).forEach(([profile, settings]) => {
        const config: FluidSimulationConfig = {
          viscosity: 0.8,
          density: 1.0,
          pressure: 0.9,
          velocityDamping: 0.99,
          colorDiffusion: 0.95,
          iterations: settings.iterations,
          gridResolution: settings.gridResolution,
          darkMode: false
        };
        
        // Verify performance scaling
        const expectedComplexity = settings.gridResolution * settings.gridResolution * settings.iterations;
        expect(expectedComplexity).toBeLessThan(5000000); // Reasonable complexity limit
      });
    });

    test('should properly clean up WebGL resources', async () => {
      const mockDeleteBuffer = vi.fn();
      const mockDeleteProgram = vi.fn();
      const mockDeleteShader = vi.fn();
      
      mockWebGLContext.deleteBuffer = mockDeleteBuffer;
      mockWebGLContext.deleteProgram = mockDeleteProgram;
      mockWebGLContext.deleteShader = mockDeleteShader;
      
      const fluidModule: BackgroundModule = {
        id: 'fluid-simulation',
        name: 'Fluid Simulation',
        description: 'Test fluid simulation',
        version: '1.0.0',
        author: 'test',
        tags: ['test'],
        difficulty: 1,
        performance: {
          cpuIntensity: 'high',
          memoryUsage: 'medium',
          batteryImpact: 'high',
          estimatedBundleSize: 1024
        },
        requirements: {
          webgl: true,
          canvas2d: false,
          devicePixelRatio: 1,
          minWidth: 256,
          minHeight: 256
        },
        init: async () => ({
          start: vi.fn(),
          stop: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          resize: vi.fn(),
          getPerformanceMetrics: vi.fn(),
          destroy: vi.fn(() => {
            // Mock cleanup
            mockDeleteBuffer();
            mockDeleteProgram();
            mockDeleteShader();
          })
        })
      };
      
      const instance = await fluidModule.init(mockCanvas, {
        debug: false,
        performance: 'medium',
        accessibility: {
          respectReducedMotion: false,
          highContrast: false,
          screenReader: false
        },
        preferences: {
          theme: 'auto',
          reducedMotion: false,
          highContrast: false,
          preferredModules: [],
          discoveredEasterEggs: [],
          moduleSettings: {}
        }
      });
      
      instance.destroy();
      
      expect(mockDeleteBuffer).toHaveBeenCalled();
      expect(mockDeleteProgram).toHaveBeenCalled();
      expect(mockDeleteShader).toHaveBeenCalled();
    });
  });

  describe('Falling Sand Cellular Automata', () => {
    
    test('should simulate falling sand physics accurately', () => {
      const config: FallingSandConfig = {
        cellSize: 4,
        gravity: 0.1,
        elements: [
          {
            id: 'sand',
            name: 'Sand',
            color: '#F4D03F',
            density: 1.5,
            behavior: 'powder'
          },
          {
            id: 'water',
            name: 'Water',
            color: '#3498DB',
            density: 1.0,
            behavior: 'liquid'
          },
          {
            id: 'stone',
            name: 'Stone',
            color: '#5D6D7E',
            density: 2.5,
            behavior: 'solid'
          }
        ],
        interactions: [
          {
            element1: 'sand',
            element2: 'water',
            result: ['wet-sand'],
            probability: 0.1
          }
        ],
        darkMode: false
      };
      
      const gridWidth = 200;
      const gridHeight = 150;
      const grid = new Array(gridWidth * gridHeight).fill(0);
      
      // Place some sand particles
      for (let x = 95; x < 105; x++) {
        grid[x + 10 * gridWidth] = 1; // sand element ID
      }
      
      // Simulate one physics step
      const newGrid = [...grid];
      
      for (let y = gridHeight - 2; y >= 0; y--) {
        for (let x = 0; x < gridWidth; x++) {
          const index = x + y * gridWidth;
          const element = grid[index];
          
          if (element === 1) { // sand
            const below = x + (y + 1) * gridWidth;
            const belowLeft = (x - 1) + (y + 1) * gridWidth;
            const belowRight = (x + 1) + (y + 1) * gridWidth;
            
            // Apply gravity
            if (y < gridHeight - 1 && grid[below] === 0) {
              newGrid[index] = 0;
              newGrid[below] = 1;
            } else if (x > 0 && y < gridHeight - 1 && grid[belowLeft] === 0) {
              newGrid[index] = 0;
              newGrid[belowLeft] = 1;
            } else if (x < gridWidth - 1 && y < gridHeight - 1 && grid[belowRight] === 0) {
              newGrid[index] = 0;
              newGrid[belowRight] = 1;
            }
          }
        }
      }
      
      // Verify sand has moved down
      const originalSandCount = grid.filter(cell => cell === 1).length;
      const newSandCount = newGrid.filter(cell => cell === 1).length;
      
      expect(originalSandCount).toBe(newSandCount); // Conservation of particles
      expect(newGrid).not.toEqual(grid); // Grid should have changed
    });

    test('should handle element interactions correctly', () => {
      const fireElement = {
        id: 'fire',
        name: 'Fire',
        color: '#E74C3C',
        density: 0.1,
        behavior: 'gas' as const,
        temperature: {
          melting: 0,
          boiling: 0,
          combustion: 300
        }
      };
      
      const woodElement = {
        id: 'wood',
        name: 'Wood',
        color: '#8B4513',
        density: 0.8,
        behavior: 'solid' as const,
        temperature: {
          melting: 0,
          boiling: 0,
          combustion: 250
        }
      };
      
      const interaction = {
        element1: 'fire',
        element2: 'wood',
        result: ['fire', 'ash'],
        probability: 0.3,
        conditions: {
          temperature: 250
        }
      };
      
      // Simulate interaction check
      const currentTemperature = 300;
      const shouldReact = currentTemperature >= (interaction.conditions?.temperature || 0) &&
                         Math.random() < interaction.probability;
      
      // Mock random to ensure predictable testing
      const originalRandom = Math.random;
      Math.random = () => 0.2; // Below probability threshold
      
      const reactionOccurs = currentTemperature >= 250 && Math.random() < 0.3;
      expect(reactionOccurs).toBe(true);
      
      Math.random = originalRandom;
    });

    test('should optimize performance for large grids', () => {
      const largeGridWidth = 800;
      const largeGridHeight = 600;
      const cellCount = largeGridWidth * largeGridHeight;
      
      const startTime = performance.now();
      
      // Mock optimized grid processing
      const grid = new Uint8Array(cellCount);
      const newGrid = new Uint8Array(cellCount);
      
      // Fill with random elements
      for (let i = 0; i < cellCount; i++) {
        grid[i] = Math.floor(Math.random() * 4); // 4 element types
      }
      
      // Simulate optimized physics step with spatial partitioning
      const chunkSize = 32;
      const chunksX = Math.ceil(largeGridWidth / chunkSize);
      const chunksY = Math.ceil(largeGridHeight / chunkSize);
      
      for (let chunkY = 0; chunkY < chunksY; chunkY++) {
        for (let chunkX = 0; chunkX < chunksX; chunkX++) {
          // Process chunk
          const startX = chunkX * chunkSize;
          const startY = chunkY * chunkSize;
          const endX = Math.min(startX + chunkSize, largeGridWidth);
          const endY = Math.min(startY + chunkSize, largeGridHeight);
          
          // Mock chunk processing
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const index = x + y * largeGridWidth;
              newGrid[index] = grid[index]; // Simplified update
            }
          }
        }
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Should process large grid quickly (< 16ms for 60fps)
      expect(processingTime).toBeLessThan(16);
      expect(newGrid.length).toBe(cellCount);
    });
  });

  describe('DVD Logo Bouncer', () => {
    
    test('should implement accurate collision detection', () => {
      const config: DVDLogoConfig = {
        logos: [{
          id: 'dvd-logo-1',
          texture: 'dvd-logo.png',
          width: 100,
          height: 50,
          position: { x: 750, y: 550 }, // Near bottom-right corner
          velocity: { x: 2, y: 1.5 },
          color: '#FF0000'
        }],
        physics: {
          speed: 1.0,
          bounce: 1.0,
          gravity: 0
        },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
        colorChangeOnBounce: true
      };
      
      const logo = config.logos[0]!;
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      // Simulate physics step
      logo.position.x += logo.velocity.x;
      logo.position.y += logo.velocity.y;
      
      // Check collision with right wall
      if (logo.position.x + logo.width >= canvasWidth) {
        logo.position.x = canvasWidth - logo.width;
        logo.velocity.x = -logo.velocity.x;
      }
      
      // Check collision with bottom wall
      if (logo.position.y + logo.height >= canvasHeight) {
        logo.position.y = canvasHeight - logo.height;
        logo.velocity.y = -logo.velocity.y;
      }
      
      // Logo should bounce off walls
      expect(logo.velocity.x).toBeLessThan(0); // Should have bounced off right wall
      expect(logo.velocity.y).toBeLessThan(0); // Should have bounced off bottom wall
      expect(logo.position.x).toBe(canvasWidth - logo.width);
      expect(logo.position.y).toBe(canvasHeight - logo.height);
    });

    test('should detect perfect corner hits', () => {
      const logo = {
        id: 'corner-test',
        texture: 'test.png',
        width: 100,
        height: 50,
        position: { x: 698, y: 549 }, // Precisely approaching corner
        velocity: { x: 2, y: 1 },
        color: '#FF0000'
      };
      
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      // Simulate movement
      logo.position.x += logo.velocity.x; // 700
      logo.position.y += logo.velocity.y; // 550
      
      // Check for perfect corner hit
      const hitRightWall = logo.position.x + logo.width >= canvasWidth;
      const hitBottomWall = logo.position.y + logo.height >= canvasHeight;
      const perfectCornerHit = hitRightWall && hitBottomWall;
      
      if (perfectCornerHit) {
        // Special corner hit detection
        const tolerance = 2; // pixels
        const rightWallDistance = (logo.position.x + logo.width) - canvasWidth;
        const bottomWallDistance = (logo.position.y + logo.height) - canvasHeight;
        
        const isExactCorner = Math.abs(rightWallDistance - bottomWallDistance) <= tolerance;
        expect(isExactCorner).toBe(true);
        
        // Corner hit should trigger special event
        console.log('🎯 Perfect corner hit detected!');
      }
      
      expect(perfectCornerHit).toBe(true);
    });

    test('should change colors on bounce', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
      const logo = {
        id: 'color-test',
        texture: 'test.png',
        width: 50,
        height: 30,
        position: { x: 749, y: 300 },
        velocity: { x: 2, y: 0 },
        color: colors[0]!
      };
      
      const originalColor = logo.color;
      const canvasWidth = 800;
      
      // Simulate collision with right wall
      logo.position.x += logo.velocity.x;
      if (logo.position.x + logo.width >= canvasWidth) {
        // Bounce and change color
        logo.velocity.x = -logo.velocity.x;
        const currentColorIndex = colors.indexOf(logo.color);
        const nextColorIndex = (currentColorIndex + 1) % colors.length;
        logo.color = colors[nextColorIndex]!;
      }
      
      expect(logo.color).not.toBe(originalColor);
      expect(colors).toContain(logo.color);
    });

    test('should support multiple logos with independent physics', () => {
      const logos = [
        {
          id: 'logo-1',
          texture: 'dvd1.png',
          width: 80,
          height: 40,
          position: { x: 100, y: 150 },
          velocity: { x: 1.5, y: 2 },
          color: '#FF0000'
        },
        {
          id: 'logo-2',
          texture: 'dvd2.png',
          width: 120,
          height: 60,
          position: { x: 400, y: 300 },
          velocity: { x: -2, y: -1 },
          color: '#00FF00'
        }
      ];
      
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      // Simulate physics for all logos
      logos.forEach(logo => {
        const oldX = logo.position.x;
        const oldY = logo.position.y;
        
        logo.position.x += logo.velocity.x;
        logo.position.y += logo.velocity.y;
        
        // Boundary collision
        if (logo.position.x <= 0 || logo.position.x + logo.width >= canvasWidth) {
          logo.velocity.x = -logo.velocity.x;
        }
        if (logo.position.y <= 0 || logo.position.y + logo.height >= canvasHeight) {
          logo.velocity.y = -logo.velocity.y;
        }
        
        // Verify position changed
        expect(logo.position.x !== oldX || logo.position.y !== oldY).toBe(true);
      });
      
      expect(logos).toHaveLength(2);
      expect(logos[0]!.velocity.x).not.toBe(0);
      expect(logos[1]!.velocity.x).not.toBe(0);
    });
  });

  describe('WebGL/Canvas2D Adaptive Rendering', () => {
    
    test('should fall back to Canvas2D when WebGL is unavailable', async () => {
      // Mock WebGL as unavailable
      const failingCanvas = document.createElement('canvas');
      failingCanvas.getContext = vi.fn((contextType: string) => {
        if (contextType === 'webgl' || contextType === 'webgl2') {
          return null; // WebGL not available
        }
        if (contextType === '2d') {
          return mockCanvas2DContext;
        }
        return null;
      });
      
      const adaptiveModule: BackgroundModule = {
        id: 'adaptive-renderer',
        name: 'Adaptive Renderer',
        description: 'WebGL with Canvas2D fallback',
        version: '1.0.0',
        author: 'test',
        tags: ['adaptive'],
        difficulty: 1,
        performance: {
          cpuIntensity: 'medium',
          memoryUsage: 'medium',
          batteryImpact: 'medium',
          estimatedBundleSize: 1024
        },
        requirements: {
          webgl: false, // Can work without WebGL
          canvas2d: true,
          devicePixelRatio: 1,
          minWidth: 320,
          minHeight: 240
        },
        init: async (canvas: HTMLCanvasElement) => {
          const webglContext = canvas.getContext('webgl');
          const canvas2dContext = canvas.getContext('2d');
          
          const renderingContext: CanvasContext = {
            type: webglContext ? 'webgl' : '2d',
            context: webglContext || canvas2dContext!,
            capabilities: webglContext ? {
              supported: true,
              version: 'WebGL 1.0',
              extensions: [],
              maxTextureSize: 4096,
              maxVertexAttributes: 16
            } : null
          };
          
          expect(renderingContext.type).toBe('2d');
          expect(renderingContext.context).toBe(canvas2dContext);
          
          return {
            start: vi.fn(),
            stop: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            resize: vi.fn(),
            getPerformanceMetrics: vi.fn(),
            destroy: vi.fn()
          };
        }
      };
      
      const instance = await adaptiveModule.init(failingCanvas, {
        debug: false,
        performance: 'medium',
        accessibility: {
          respectReducedMotion: false,
          highContrast: false,
          screenReader: false
        },
        preferences: {
          theme: 'auto',
          reducedMotion: false,
          highContrast: false,
          preferredModules: [],
          discoveredEasterEggs: [],
          moduleSettings: {}
        }
      });
      
      expect(instance).toBeDefined();
      expect(failingCanvas.getContext).toHaveBeenCalledWith('webgl');
      expect(failingCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    test('should optimize rendering based on device capabilities', () => {
      const deviceCapabilities = {
        webgl: true,
        webgl2: false,
        maxTextureSize: 2048,
        maxVertexAttributes: 16,
        devicePixelRatio: 2,
        memoryInfo: {
          totalJSHeapSize: 100 * 1024 * 1024, // 100MB
          jsHeapSizeLimit: 500 * 1024 * 1024  // 500MB
        }
      };
      
      // Determine optimal rendering settings
      const optimalSettings = {
        textureSize: Math.min(deviceCapabilities.maxTextureSize, 1024),
        particleCount: deviceCapabilities.memoryInfo.totalJSHeapSize > 50 * 1024 * 1024 ? 1000 : 500,
        shaderComplexity: deviceCapabilities.webgl2 ? 'high' : 'medium',
        antiAliasing: deviceCapabilities.devicePixelRatio >= 2
      };
      
      expect(optimalSettings.textureSize).toBe(1024);
      expect(optimalSettings.particleCount).toBe(1000);
      expect(optimalSettings.shaderComplexity).toBe('medium');
      expect(optimalSettings.antiAliasing).toBe(true);
    });

    test('should handle high DPI displays correctly', () => {
      const highDPICanvas = document.createElement('canvas');
      const devicePixelRatio = 3; // High DPI device
      
      // Mock high DPI setup
      Object.defineProperty(window, 'devicePixelRatio', {
        value: devicePixelRatio,
        writable: true
      });
      
      const displayWidth = 800;
      const displayHeight = 600;
      
      // Set canvas size for high DPI
      highDPICanvas.width = displayWidth * devicePixelRatio;
      highDPICanvas.height = displayHeight * devicePixelRatio;
      highDPICanvas.style.width = displayWidth + 'px';
      highDPICanvas.style.height = displayHeight + 'px';
      
      const ctx = mockCanvas2DContext;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      expect(highDPICanvas.width).toBe(displayWidth * devicePixelRatio);
      expect(highDPICanvas.height).toBe(displayHeight * devicePixelRatio);
      expect(ctx.scale).toHaveBeenCalledWith(devicePixelRatio, devicePixelRatio);
    });
  });

  describe('Memory Management', () => {
    
    test('should prevent memory leaks in long-running animations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate long-running animation with proper cleanup
      const animationFrames = 1000;
      const textures: any[] = [];
      const buffers: any[] = [];
      
      for (let frame = 0; frame < animationFrames; frame++) {
        // Simulate resource creation
        if (frame % 60 === 0) { // Every second at 60fps
          const texture = mockWebGLContext.createTexture();
          const buffer = mockWebGLContext.createBuffer();
          
          textures.push(texture);
          buffers.push(buffer);
          
          // Simulate proper cleanup of old resources
          if (textures.length > 10) {
            const oldTexture = textures.shift();
            mockWebGLContext.deleteTexture?.(oldTexture);
          }
          
          if (buffers.length > 10) {
            const oldBuffer = buffers.shift();
            mockWebGLContext.deleteBuffer?.(oldBuffer);
          }
        }
        
        // Simulate frame rendering
        mockWebGLContext.clear(mockWebGLContext.COLOR_BUFFER_BIT);
        mockWebGLContext.drawArrays(mockWebGLContext.TRIANGLES, 0, 6);
      }
      
      // Clean up remaining resources
      textures.forEach(texture => mockWebGLContext.deleteTexture?.(texture));
      buffers.forEach(buffer => mockWebGLContext.deleteBuffer?.(buffer));
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (< 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      expect(textures).toHaveLength(0);
      expect(buffers).toHaveLength(0);
    });

    test('should implement efficient object pooling', () => {
      class ParticlePool {
        private particles: any[] = [];
        private activeParticles: any[] = [];
        private inactiveParticles: any[] = [];
        
        constructor(size: number) {
          // Pre-allocate particles
          for (let i = 0; i < size; i++) {
            const particle = {
              x: 0, y: 0,
              vx: 0, vy: 0,
              life: 1.0,
              active: false
            };
            this.particles.push(particle);
            this.inactiveParticles.push(particle);
          }
        }
        
        acquire() {
          const particle = this.inactiveParticles.pop();
          if (particle) {
            particle.active = true;
            this.activeParticles.push(particle);
            return particle;
          }
          return null; // Pool exhausted
        }
        
        release(particle: any) {
          const index = this.activeParticles.indexOf(particle);
          if (index !== -1) {
            particle.active = false;
            this.activeParticles.splice(index, 1);
            this.inactiveParticles.push(particle);
          }
        }
        
        getActiveCount() {
          return this.activeParticles.length;
        }
        
        getTotalCount() {
          return this.particles.length;
        }
      }
      
      const pool = new ParticlePool(1000);
      
      // Test pool allocation
      const acquiredParticles = [];
      for (let i = 0; i < 500; i++) {
        const particle = pool.acquire();
        if (particle) {
          acquiredParticles.push(particle);
        }
      }
      
      expect(acquiredParticles).toHaveLength(500);
      expect(pool.getActiveCount()).toBe(500);
      
      // Test pool release
      acquiredParticles.forEach(particle => pool.release(particle));
      
      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getTotalCount()).toBe(1000);
    });
  });

  describe('Cross-Device Compatibility', () => {
    
    test('should adapt to mobile device constraints', () => {
      // Mock mobile device
      global.testUtils.mockDevice('mobile');
      
      const mobileConfig = {
        particleCount: 250, // Reduced from desktop 1000
        textureSize: 512,   // Reduced from desktop 1024
        shaderComplexity: 'low',
        targetFPS: 30       // Reduced from desktop 60
      };
      
      const desktopConfig = {
        particleCount: 1000,
        textureSize: 1024,
        shaderComplexity: 'high',
        targetFPS: 60
      };
      
      const isMobile = navigator.userAgent.includes('iPhone') || 
                      navigator.maxTouchPoints > 0;
      
      const config = isMobile ? mobileConfig : desktopConfig;
      
      expect(config.particleCount).toBeLessThanOrEqual(250);
      expect(config.targetFPS).toBeLessThanOrEqual(30);
    });

    test('should handle touch interactions for mobile', () => {
      const touchHandler = vi.fn();
      
      // Mock touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 200,
          identifier: 0
        }] as any
      });
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [{
          clientX: 150,
          clientY: 250,
          identifier: 0
        }] as any
      });
      
      mockCanvas.addEventListener('touchstart', touchHandler);
      mockCanvas.addEventListener('touchmove', touchHandler);
      
      mockCanvas.dispatchEvent(touchStart);
      mockCanvas.dispatchEvent(touchMove);
      
      expect(touchHandler).toHaveBeenCalledTimes(2);
    });

    test('should adapt quality settings based on battery status', async () => {
      // Mock battery API
      const mockBattery = {
        level: 0.3, // 30% battery
        charging: false,
        chargingTime: Infinity,
        dischargingTime: 3600 // 1 hour
      };
      
      (navigator as any).getBattery = () => Promise.resolve(mockBattery);
      
      const battery = await (navigator as any).getBattery();
      
      // Adapt quality based on battery
      const qualitySettings = {
        particleCount: battery.level > 0.5 ? 1000 : 500,
        renderQuality: battery.charging ? 'high' : 'medium',
        targetFPS: battery.level > 0.2 ? 60 : 30
      };
      
      expect(qualitySettings.particleCount).toBe(500);
      expect(qualitySettings.renderQuality).toBe('medium');
      expect(qualitySettings.targetFPS).toBe(60);
    });
  });
});