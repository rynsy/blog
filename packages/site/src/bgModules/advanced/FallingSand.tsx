/**
 * Phase 4 Advanced Features - Falling Sand Cellular Automata Module
 * Multi-material physics simulation with WebGL acceleration
 * Optimized for <50KB bundle size and >30fps performance
 */

import { 
  BackgroundModule, 
  ModuleInstance, 
  ModuleOptions, 
  PerformanceMetrics,
  FallingSandConfig,
  SandElement,
  ElementInteraction
} from '@/types/background';

// Cellular automata constants
const CELL_SIZE = 4; // pixels per cell
const MAX_ELEMENTS = 8; // maximum number of element types

// Element definitions
const SAND_ELEMENTS: SandElement[] = [
  {
    id: 'empty',
    name: 'Empty',
    color: '#000000',
    density: 0,
    behavior: 'gas'
  },
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
    color: '#566573',
    density: 2.5,
    behavior: 'solid'
  },
  {
    id: 'fire',
    name: 'Fire',
    color: '#E74C3C',
    density: 0.1,
    behavior: 'gas',
    temperature: {
      melting: 1000,
      boiling: 2000,
      combustion: 300
    }
  },
  {
    id: 'steam',
    name: 'Steam',
    color: '#BDC3C7',
    density: 0.05,
    behavior: 'gas'
  },
  {
    id: 'lava',
    name: 'Lava',
    color: '#D35400',
    density: 2.0,
    behavior: 'liquid',
    temperature: {
      melting: 1500,
      boiling: 3000,
      combustion: 800
    }
  },
  {
    id: 'ice',
    name: 'Ice',
    color: '#AED6F1',
    density: 0.9,
    behavior: 'solid',
    temperature: {
      melting: 0,
      boiling: 100,
      combustion: -1
    }
  }
];

// Element interactions
const ELEMENT_INTERACTIONS: ElementInteraction[] = [
  {
    element1: 'fire',
    element2: 'water',
    result: ['steam', 'empty'],
    probability: 0.8
  },
  {
    element1: 'fire',
    element2: 'ice',
    result: ['water', 'empty'],
    probability: 0.9
  },
  {
    element1: 'lava',
    element2: 'water',
    result: ['stone', 'steam'],
    probability: 0.7
  },
  {
    element1: 'water',
    element2: 'ice',
    result: ['ice', 'ice'],
    probability: 0.1,
    conditions: { temperature: -10 }
  }
];

// WebGL shaders for cellular automata
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const UPDATE_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_currentState;
  uniform vec2 u_resolution;
  uniform float u_gravity;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_mousePressed;
  uniform int u_selectedElement;
  
  varying vec2 v_texCoord;
  
  // Element properties encoded in texture channels
  // R: element type (0-7)
  // G: velocity_x (-1 to 1 mapped to 0-1)
  // B: velocity_y (-1 to 1 mapped to 0-1)
  // A: temperature (0-1)
  
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  vec4 getCell(vec2 offset) {
    vec2 coord = v_texCoord + offset / u_resolution;
    if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) {
      return vec4(0.0, 0.5, 0.5, 0.0); // Empty cell
    }
    return texture2D(u_currentState, coord);
  }
  
  void main() {
    vec2 pixelPos = v_texCoord * u_resolution;
    vec4 current = texture2D(u_currentState, v_texCoord);
    
    int elementType = int(current.r * 7.0 + 0.5);
    vec2 velocity = (current.gb - 0.5) * 2.0;
    float temperature = current.a;
    
    // Mouse interaction - add selected element
    vec2 mousePixel = u_mouse;
    float mouseDist = length(pixelPos - mousePixel);
    if (mouseDist < 8.0 && u_mousePressed > 0.5) {
      elementType = u_selectedElement;
      velocity = vec2(0.0);
      temperature = 0.5;
    }
    
    // Skip processing for empty cells
    if (elementType == 0) {
      // Check if we should spawn from above
      vec4 above = getCell(vec2(0.0, 1.0));
      if (int(above.r * 7.0 + 0.5) != 0) {
        vec2 aboveVel = (above.gb - 0.5) * 2.0;
        if (aboveVel.y < -0.1) {
          gl_FragColor = above;
          return;
        }
      }
      gl_FragColor = current;
      return;
    }
    
    // Apply gravity based on density
    float[] densities = float[8](0.0, 1.5, 1.0, 2.5, 0.1, 0.05, 2.0, 0.9);
    float density = densities[elementType];
    
    if (density > 0.5) {
      velocity.y -= u_gravity * 0.1;
    } else if (density < 0.5) {
      velocity.y += u_gravity * 0.05; // Buoyancy
    }
    
    // Movement rules based on element behavior
    vec4 below = getCell(vec2(0.0, -1.0));
    vec4 left = getCell(vec2(-1.0, 0.0));
    vec4 right = getCell(vec2(1.0, 0.0));
    vec4 belowLeft = getCell(vec2(-1.0, -1.0));
    vec4 belowRight = getCell(vec2(1.0, -1.0));
    
    int belowType = int(below.r * 7.0 + 0.5);
    int leftType = int(left.r * 7.0 + 0.5);
    int rightType = int(right.r * 7.0 + 0.5);
    int belowLeftType = int(belowLeft.r * 7.0 + 0.5);
    int belowRightType = int(belowRight.r * 7.0 + 0.5);
    
    float[] elementDensities = float[8](0.0, 1.5, 1.0, 2.5, 0.1, 0.05, 2.0, 0.9);
    
    bool canMoveDown = belowType == 0 || elementDensities[belowType] < density;
    bool canMoveLeft = belowLeftType == 0 || elementDensities[belowLeftType] < density;
    bool canMoveRight = belowRightType == 0 || elementDensities[belowRightType] < density;
    
    // Powder behavior (sand)
    if (elementType == 1) {
      if (canMoveDown) {
        velocity.y = min(velocity.y - 0.1, -0.5);
      } else if (canMoveLeft && rand(pixelPos + u_time) > 0.5) {
        velocity.x = -0.3;
        velocity.y = -0.1;
      } else if (canMoveRight) {
        velocity.x = 0.3;
        velocity.y = -0.1;
      } else {
        velocity *= 0.8; // Friction
      }
    }
    
    // Liquid behavior (water, lava)
    if (elementType == 2 || elementType == 6) {
      if (canMoveDown) {
        velocity.y = min(velocity.y - 0.05, -0.3);
      } else {
        // Spread sideways
        float pressure = abs(velocity.x) + abs(velocity.y);
        if (leftType == 0 && rightType == 0) {
          velocity.x = (rand(pixelPos + u_time) - 0.5) * 0.5;
        } else if (leftType == 0) {
          velocity.x = -0.2 - pressure * 0.1;
        } else if (rightType == 0) {
          velocity.x = 0.2 + pressure * 0.1;
        }
        velocity.y *= 0.9;
      }
      velocity *= 0.95; // Viscosity
    }
    
    // Gas behavior (fire, steam)
    if (elementType == 4 || elementType == 5) {
      velocity.y += 0.02; // Buoyancy
      velocity += (vec2(rand(pixelPos + u_time), rand(pixelPos + u_time + 1.0)) - 0.5) * 0.1;
      velocity *= 0.98;
      
      // Fire spreads
      if (elementType == 4) {
        temperature = min(temperature + 0.01, 1.0);
      }
    }
    
    // Clamp velocity
    velocity = clamp(velocity, vec2(-1.0), vec2(1.0));
    
    // Life decay for fire and steam
    if (elementType == 4 || elementType == 5) {
      temperature -= 0.003;
      if (temperature <= 0.0) {
        elementType = 0; // Dissipate
      }
    }
    
    gl_FragColor = vec4(
      float(elementType) / 7.0,
      (velocity.x + 1.0) * 0.5,
      (velocity.y + 1.0) * 0.5,
      temperature
    );
  }
`;

const RENDER_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_currentState;
  uniform vec2 u_resolution;
  uniform bool u_darkMode;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 state = texture2D(u_currentState, v_texCoord);
    int elementType = int(state.r * 7.0 + 0.5);
    float temperature = state.a;
    vec2 velocity = (state.gb - 0.5) * 2.0;
    
    vec3 baseColors[8];
    baseColors[0] = vec3(0.0, 0.0, 0.0);      // empty
    baseColors[1] = vec3(0.957, 0.816, 0.247); // sand
    baseColors[2] = vec3(0.207, 0.596, 0.859); // water
    baseColors[3] = vec3(0.337, 0.396, 0.451); // stone
    baseColors[4] = vec3(0.906, 0.298, 0.235); // fire
    baseColors[5] = vec3(0.741, 0.765, 0.780); // steam
    baseColors[6] = vec3(0.827, 0.329, 0.000); // lava
    baseColors[7] = vec3(0.682, 0.839, 0.945); // ice
    
    vec3 color = baseColors[elementType];
    
    // Temperature coloring for fire and lava
    if (elementType == 4) {
      float heat = temperature;
      color = mix(vec3(0.4, 0.0, 0.0), vec3(1.0, 0.8, 0.0), heat);
      color += vec3(heat * 0.3); // Brightness
    } else if (elementType == 6) {
      float heat = temperature;
      color = mix(vec3(0.5, 0.1, 0.0), vec3(1.0, 0.6, 0.0), heat);
    }
    
    // Velocity-based shading for liquids
    if (elementType == 2 || elementType == 6) {
      float speed = length(velocity);
      color += vec3(speed * 0.1);
    }
    
    // Steam transparency
    float alpha = 1.0;
    if (elementType == 5) {
      alpha = temperature * 0.7 + 0.3;
    }
    
    // Theme adaptation
    if (u_darkMode && elementType != 0) {
      color *= 1.2; // Brighter in dark mode
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Falling sand simulation class
class FallingSandSimulation {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private config: FallingSandConfig;
  
  private width: number;
  private height: number;
  
  private currentTexture: WebGLTexture;
  private nextTexture: WebGLTexture;
  private currentFramebuffer: WebGLFramebuffer;
  private nextFramebuffer: WebGLFramebuffer;
  
  private updateProgram: WebGLProgram;
  private renderProgram: WebGLProgram;
  private quadBuffer: WebGLBuffer;
  
  private selectedElement = 1; // Default to sand
  private mousePos = { x: 0, y: 0 };
  private mousePressed = false;
  
  private frameCount = 0;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, config: FallingSandConfig) {
    this.canvas = canvas;
    this.config = config;
    
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    
    if (!gl) {
      throw new Error('WebGL not supported for Falling Sand');
    }
    
    this.gl = gl as WebGLRenderingContext;
    
    // Calculate simulation dimensions
    this.width = Math.floor(canvas.width / config.cellSize);
    this.height = Math.floor(canvas.height / config.cellSize);
    
    this.initializeGL();
    this.setupInteraction();
  }
  
  private initializeGL() {
    const gl = this.gl;
    
    // Create shaders
    this.updateProgram = this.createProgram(VERTEX_SHADER, UPDATE_FRAGMENT_SHADER);
    this.renderProgram = this.createProgram(VERTEX_SHADER, RENDER_FRAGMENT_SHADER);
    
    // Create quad buffer
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1
    ]), gl.STATIC_DRAW);
    
    // Create textures and framebuffers
    this.createFramebuffers();
    
    // Initialize with empty state
    this.initializeState();
  }
  
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Failed to link program: ' + gl.getProgramInfoLog(program));
    }
    
    return program;
  }
  
  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Failed to compile shader: ' + gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }
  
  private createFramebuffers() {
    const gl = this.gl;
    
    // Create textures for double buffering
    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      const framebuffer = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      if (i === 0) {
        this.currentTexture = texture;
        this.currentFramebuffer = framebuffer;
      } else {
        this.nextTexture = texture;
        this.nextFramebuffer = framebuffer;
      }
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  
  private initializeState() {
    const gl = this.gl;
    
    // Create initial state data
    const stateData = new Uint8Array(this.width * this.height * 4);
    stateData.fill(0); // All empty initially
    
    gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, stateData);
  }
  
  private setupInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = (e.clientX - rect.left) / this.config.cellSize;
      this.mousePos.y = this.height - (e.clientY - rect.top) / this.config.cellSize;
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.mousePressed = true;
      e.preventDefault();
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.mousePressed = false;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePressed = false;
    });
    
    // Element selection with number keys
    document.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        this.selectedElement = num;
      }
    });
  }
  
  public step(deltaTime: number) {
    const gl = this.gl;
    
    // Update simulation
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.nextFramebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.updateProgram);
    
    this.bindQuad(this.updateProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, 'u_currentState'), 0);
    
    gl.uniform2f(gl.getUniformLocation(this.updateProgram, 'u_resolution'), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_gravity'), this.config.gravity);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_time'), Date.now() * 0.001);
    gl.uniform2f(gl.getUniformLocation(this.updateProgram, 'u_mouse'), this.mousePos.x, this.mousePos.y);
    gl.uniform1f(gl.getUniformLocation(this.updateProgram, 'u_mousePressed'), this.mousePressed ? 1.0 : 0.0);
    gl.uniform1i(gl.getUniformLocation(this.updateProgram, 'u_selectedElement'), this.selectedElement);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap buffers
    const tempTexture = this.currentTexture;
    const tempFramebuffer = this.currentFramebuffer;
    this.currentTexture = this.nextTexture;
    this.currentFramebuffer = this.nextFramebuffer;
    this.nextTexture = tempTexture;
    this.nextFramebuffer = tempFramebuffer;
    
    this.frameCount++;
  }
  
  public render() {
    const gl = this.gl;
    
    // Render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.renderProgram);
    
    this.bindQuad(this.renderProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_currentState'), 0);
    
    gl.uniform2f(gl.getUniformLocation(this.renderProgram, 'u_resolution'), this.width, this.height);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_darkMode'), this.config.darkMode ? 1 : 0);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    gl.disable(gl.BLEND);
  }
  
  private bindQuad(program: WebGLProgram) {
    const gl = this.gl;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  }
  
  public getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    const fps = deltaTime > 0 ? 1000 / deltaTime : 60;
    
    return {
      fps: Math.round(fps),
      memoryUsage: this.width * this.height * 8 / 1024 / 1024, // Rough estimate
      cpuUsage: Math.min(100, Math.max(0, (60 - fps) * 2)),
      renderTime: deltaTime,
      timestamp: now
    };
  }
  
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    const newWidth = Math.floor(width / this.config.cellSize);
    const newHeight = Math.floor(height / this.config.cellSize);
    
    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;
      this.createFramebuffers();
      this.initializeState();
    }
  }
  
  public setElement(elementId: string) {
    const element = SAND_ELEMENTS.find(e => e.id === elementId);
    if (element) {
      this.selectedElement = SAND_ELEMENTS.indexOf(element);
    }
  }
  
  public cleanup() {
    const gl = this.gl;
    
    gl.deleteTexture(this.currentTexture);
    gl.deleteTexture(this.nextTexture);
    gl.deleteFramebuffer(this.currentFramebuffer);
    gl.deleteFramebuffer(this.nextFramebuffer);
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteProgram(this.updateProgram);
    gl.deleteProgram(this.renderProgram);
  }
}

// Module instance
class FallingSandInstance implements ModuleInstance {
  private simulation: FallingSandSimulation;
  private animationId: number | null = null;
  private isRunning = false;
  private isPaused = false;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, options: ModuleOptions) {
    const config: FallingSandConfig = {
      cellSize: options.performance === 'high' ? 3 : options.performance === 'medium' ? 4 : 6,
      gravity: 0.8,
      elements: SAND_ELEMENTS,
      interactions: ELEMENT_INTERACTIONS,
      darkMode: options.preferences.theme === 'dark' || 
               (options.preferences.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    };
    
    this.simulation = new FallingSandSimulation(canvas, config);
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    if (this.isRunning) {
      this.animate();
    }
  }

  resize(width: number, height: number) {
    this.simulation.resize(width, height);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.simulation.getPerformanceMetrics();
  }

  destroy() {
    this.stop();
    this.simulation.cleanup();
  }
  
  handleKeyboardEvent(event: KeyboardEvent) {
    // Element selection handled by simulation
  }

  private animate = (currentTime: number = 0) => {
    if (!this.isRunning || this.isPaused) return;
    
    const deltaTime = currentTime - (this.lastFrameTime || currentTime);
    this.lastFrameTime = currentTime;
    
    // Update at 30fps for performance
    if (deltaTime >= 33.33) {
      this.simulation.step(deltaTime);
    }
    
    this.simulation.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };
}

// Module definition
const FallingSandModule: BackgroundModule = {
  id: 'falling-sand',
  name: 'Falling Sand',
  description: 'Interactive cellular automata with multi-material physics simulation',
  version: '1.0.0',
  author: 'Multi-Agent Team',
  tags: ['simulation', 'interactive', 'cellular-automata', 'physics', 'webgl'],
  difficulty: 4,
  
  performance: {
    cpuIntensity: 'high',
    memoryUsage: 'medium',
    batteryImpact: 'medium',
    estimatedBundleSize: 28000 // ~28KB
  },
  
  requirements: {
    webgl: true,
    canvas2d: false,
    devicePixelRatio: 1,
    minWidth: 600,
    minHeight: 400
  },
  
  init: async (canvas: HTMLCanvasElement, options: ModuleOptions) => {
    return new FallingSandInstance(canvas, options);
  },
  
  easterEgg: {
    id: 'alchemist-master',
    difficulty: 5,
    triggers: [{
      type: 'interaction',
      data: { count: 20, type: 'element-combinations' }
    }],
    reward: {
      type: 'visual',
      content: 'rainbow-elements-mode',
      duration: 20000
    },
    discoveryHint: 'Experiment with all element combinations to unlock the secret...'
  }
};

export default FallingSandModule;
export { SAND_ELEMENTS, ELEMENT_INTERACTIONS };
