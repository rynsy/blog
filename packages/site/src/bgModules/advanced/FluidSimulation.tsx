/**
 * Phase 4 Advanced Features - Fluid Simulation Module
 * WebGL-based fluid dynamics with adaptive performance
 */

import { 
  BackgroundModule, 
  ModuleInstance, 
  ModuleOptions, 
  PerformanceMetrics,
  FluidSimulationConfig 
} from '@/types/background';

// WebGL shader sources
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const VELOCITY_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_velocity;
  uniform sampler2D u_pressure;
  uniform vec2 u_resolution;
  uniform float u_dt;
  uniform vec2 u_mouse;
  uniform float u_mousePressed;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0) / u_resolution;
    vec2 velocity = texture2D(u_velocity, v_texCoord).xy;
    
    // Advection - move velocity by itself
    vec2 coord = v_texCoord - velocity * u_dt * onePixel;
    velocity = texture2D(u_velocity, coord).xy;
    
    // Mouse interaction
    vec2 mousePos = u_mouse / u_resolution;
    float distance = length(v_texCoord - mousePos);
    if (distance < 0.1 && u_mousePressed > 0.5) {
      vec2 force = (v_texCoord - mousePos) * 0.5;
      velocity += force;
    }
    
    // Viscosity - simple diffusion
    vec2 n = texture2D(u_velocity, v_texCoord + vec2(0.0, onePixel.y)).xy;
    vec2 s = texture2D(u_velocity, v_texCoord - vec2(0.0, onePixel.y)).xy;
    vec2 e = texture2D(u_velocity, v_texCoord + vec2(onePixel.x, 0.0)).xy;
    vec2 w = texture2D(u_velocity, v_texCoord - vec2(onePixel.x, 0.0)).xy;
    
    velocity += (n + s + e + w - 4.0 * velocity) * 0.02;
    
    // Damping
    velocity *= 0.995;
    
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const PRESSURE_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_velocity;
  uniform sampler2D u_pressure;
  uniform vec2 u_resolution;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0) / u_resolution;
    
    // Calculate divergence
    float n = texture2D(u_velocity, v_texCoord + vec2(0.0, onePixel.y)).y;
    float s = texture2D(u_velocity, v_texCoord - vec2(0.0, onePixel.y)).y;
    float e = texture2D(u_velocity, v_texCoord + vec2(onePixel.x, 0.0)).x;
    float w = texture2D(u_velocity, v_texCoord - vec2(onePixel.x, 0.0)).x;
    
    float divergence = (e - w + n - s) * 0.5;
    
    // Jacobi iteration for pressure
    float pN = texture2D(u_pressure, v_texCoord + vec2(0.0, onePixel.y)).x;
    float pS = texture2D(u_pressure, v_texCoord - vec2(0.0, onePixel.y)).x;
    float pE = texture2D(u_pressure, v_texCoord + vec2(onePixel.x, 0.0)).x;
    float pW = texture2D(u_pressure, v_texCoord - vec2(onePixel.x, 0.0)).x;
    
    float pressure = (pN + pS + pE + pW - divergence) * 0.25;
    
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const COLOR_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_velocity;
  uniform sampler2D u_color;
  uniform vec2 u_resolution;
  uniform float u_dt;
  uniform vec3 u_inputColor;
  uniform vec2 u_mouse;
  uniform float u_mousePressed;
  
  varying vec2 v_texCoord;
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec2 onePixel = vec2(1.0) / u_resolution;
    vec2 velocity = texture2D(u_velocity, v_texCoord).xy;
    
    // Advect color
    vec2 coord = v_texCoord - velocity * u_dt * onePixel * 50.0;
    vec3 color = texture2D(u_color, coord).rgb;
    
    // Add color at mouse position
    vec2 mousePos = u_mouse / u_resolution;
    float distance = length(v_texCoord - mousePos);
    if (distance < 0.05 && u_mousePressed > 0.5) {
      float velocityMag = length(velocity);
      float hue = fract(velocityMag * 0.1 + 0.6);
      vec3 mouseColor = hsv2rgb(vec3(hue, 0.8, 0.9));
      color = mix(color, mouseColor, 0.3);
    }
    
    // Fade over time
    color *= 0.998;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Fluid simulation class
class FluidSimulation {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private config: FluidSimulationConfig;
  
  private velocityFramebuffers: WebGLFramebuffer[];
  private pressureFramebuffers: WebGLFramebuffer[];
  private colorFramebuffers: WebGLFramebuffer[];
  
  private velocityTextures: WebGLTexture[];
  private pressureTextures: WebGLTexture[];
  private colorTextures: WebGLTexture[];
  
  private velocityProgram: WebGLProgram;
  private pressureProgram: WebGLProgram;
  private colorProgram: WebGLProgram;
  private displayProgram: WebGLProgram;
  
  private quadBuffer: WebGLBuffer;
  private currentFrame = 0;
  private mousePos = { x: 0, y: 0 };
  private mousePressed = false;
  
  private startTime = Date.now();
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor(canvas: HTMLCanvasElement, config: FluidSimulationConfig) {
    this.canvas = canvas;
    this.config = config;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    this.gl = gl as WebGLRenderingContext;
    
    this.velocityFramebuffers = [];
    this.pressureFramebuffers = [];
    this.colorFramebuffers = [];
    this.velocityTextures = [];
    this.pressureTextures = [];
    this.colorTextures = [];
    
    this.initializeGL();
  }
  
  private initializeGL() {
    const gl = this.gl;
    
    // Create shaders and programs
    this.velocityProgram = this.createProgram(VERTEX_SHADER_SOURCE, VELOCITY_FRAGMENT_SHADER);
    this.pressureProgram = this.createProgram(VERTEX_SHADER_SOURCE, PRESSURE_FRAGMENT_SHADER);
    this.colorProgram = this.createProgram(VERTEX_SHADER_SOURCE, COLOR_FRAGMENT_SHADER);
    this.displayProgram = this.createProgram(VERTEX_SHADER_SOURCE, `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_texCoord;
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `);
    
    // Create quad buffer
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1
    ]), gl.STATIC_DRAW);
    
    // Create framebuffers and textures
    this.createFramebuffers();
    
    // Set up mouse listeners
    this.setupInteraction();
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
    const width = Math.floor(this.canvas.width / this.config.gridResolution);
    const height = Math.floor(this.canvas.height / this.config.gridResolution);
    
    // Create double-buffered framebuffers for ping-pong rendering
    for (let i = 0; i < 2; i++) {
      // Velocity
      const velocityTexture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, velocityTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      const velocityFramebuffer = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, velocityTexture, 0);
      
      this.velocityTextures[i] = velocityTexture;
      this.velocityFramebuffers[i] = velocityFramebuffer;
      
      // Pressure
      const pressureTexture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, pressureTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      const pressureFramebuffer = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressureFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pressureTexture, 0);
      
      this.pressureTextures[i] = pressureTexture;
      this.pressureFramebuffers[i] = pressureFramebuffer;
      
      // Color
      const colorTexture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, colorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      const colorFramebuffer = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, colorFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
      
      this.colorTextures[i] = colorTexture;
      this.colorFramebuffers[i] = colorFramebuffer;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  
  private setupInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = rect.bottom - e.clientY; // Flip Y coordinate
    });
    
    this.canvas.addEventListener('mousedown', () => {
      this.mousePressed = true;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.mousePressed = false;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mousePressed = false;
    });
  }
  
  public step(deltaTime: number) {
    const gl = this.gl;
    
    // Set viewport
    const width = Math.floor(this.canvas.width / this.config.gridResolution);
    const height = Math.floor(this.canvas.height / this.config.gridResolution);
    gl.viewport(0, 0, width, height);
    
    const currentVelocity = this.currentFrame % 2;
    const nextVelocity = 1 - currentVelocity;
    
    // Update velocity
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocityFramebuffers[nextVelocity]);
    gl.useProgram(this.velocityProgram);
    
    this.bindQuad(this.velocityProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocityTextures[currentVelocity]);
    gl.uniform1i(gl.getUniformLocation(this.velocityProgram, 'u_velocity'), 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.pressureTextures[currentVelocity]);
    gl.uniform1i(gl.getUniformLocation(this.velocityProgram, 'u_pressure'), 1);
    
    gl.uniform2f(gl.getUniformLocation(this.velocityProgram, 'u_resolution'), width, height);
    gl.uniform1f(gl.getUniformLocation(this.velocityProgram, 'u_dt'), deltaTime * 0.001);
    gl.uniform2f(gl.getUniformLocation(this.velocityProgram, 'u_mouse'), this.mousePos.x, this.mousePos.y);
    gl.uniform1f(gl.getUniformLocation(this.velocityProgram, 'u_mousePressed'), this.mousePressed ? 1.0 : 0.0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Update pressure (multiple iterations for stability)
    for (let i = 0; i < this.config.iterations; i++) {
      const currentPressure = i % 2;
      const nextPressure = 1 - currentPressure;
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressureFramebuffers[nextPressure]);
      gl.useProgram(this.pressureProgram);
      
      this.bindQuad(this.pressureProgram);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.velocityTextures[nextVelocity]);
      gl.uniform1i(gl.getUniformLocation(this.pressureProgram, 'u_velocity'), 0);
      
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.pressureTextures[currentPressure]);
      gl.uniform1i(gl.getUniformLocation(this.pressureProgram, 'u_pressure'), 1);
      
      gl.uniform2f(gl.getUniformLocation(this.pressureProgram, 'u_resolution'), width, height);
    }
    
    // Update color
    const currentColor = this.currentFrame % 2;
    const nextColor = 1 - currentColor;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.colorFramebuffers[nextColor]);
    gl.useProgram(this.colorProgram);
    
    this.bindQuad(this.colorProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocityTextures[nextVelocity]);
    gl.uniform1i(gl.getUniformLocation(this.colorProgram, 'u_velocity'), 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[currentColor]);
    gl.uniform1i(gl.getUniformLocation(this.colorProgram, 'u_color'), 1);
    
    gl.uniform2f(gl.getUniformLocation(this.colorProgram, 'u_resolution'), width, height);
    gl.uniform1f(gl.getUniformLocation(this.colorProgram, 'u_dt'), deltaTime * 0.001);
    gl.uniform2f(gl.getUniformLocation(this.colorProgram, 'u_mouse'), this.mousePos.x, this.mousePos.y);
    gl.uniform1f(gl.getUniformLocation(this.colorProgram, 'u_mousePressed'), this.mousePressed ? 1.0 : 0.0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    this.currentFrame++;
  }
  
  public render() {
    const gl = this.gl;
    
    // Render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.displayProgram);
    
    this.bindQuad(this.displayProgram);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[this.currentFrame % 2]);
    gl.uniform1i(gl.getUniformLocation(this.displayProgram, 'u_texture'), 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    this.frameCount++;
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
      memoryUsage: 0, // WebGL memory is harder to measure
      cpuUsage: Math.min(100, Math.max(0, (60 - fps) * 2)),
      renderTime: deltaTime,
      timestamp: now
    };
  }
  
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.createFramebuffers(); // Recreate framebuffers with new size
  }
  
  public cleanup() {
    // Cleanup WebGL resources
    const gl = this.gl;
    
    this.velocityFramebuffers.forEach(fb => gl.deleteFramebuffer(fb));
    this.pressureFramebuffers.forEach(fb => gl.deleteFramebuffer(fb));
    this.colorFramebuffers.forEach(fb => gl.deleteFramebuffer(fb));
    
    this.velocityTextures.forEach(tex => gl.deleteTexture(tex));
    this.pressureTextures.forEach(tex => gl.deleteTexture(tex));
    this.colorTextures.forEach(tex => gl.deleteTexture(tex));
    
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteProgram(this.velocityProgram);
    gl.deleteProgram(this.pressureProgram);
    gl.deleteProgram(this.colorProgram);
    gl.deleteProgram(this.displayProgram);
  }
}

// Module instance
class FluidSimulationInstance implements ModuleInstance {
  private simulation: FluidSimulation;
  private animationId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  constructor(canvas: HTMLCanvasElement, options: ModuleOptions) {
    const config: FluidSimulationConfig = {
      viscosity: 0.1,
      density: 1.0,
      pressure: 0.8,
      velocityDamping: 0.995,
      colorDiffusion: 0.998,
      iterations: options.performance === 'high' ? 20 : options.performance === 'medium' ? 10 : 5,
      gridResolution: options.performance === 'high' ? 1 : options.performance === 'medium' ? 2 : 4
    };
    
    this.simulation = new FluidSimulation(canvas, config);
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

  private animate = (currentTime: number = 0) => {
    if (!this.isRunning || this.isPaused) return;
    
    const deltaTime = currentTime - (this.lastFrameTime || currentTime);
    this.lastFrameTime = currentTime;
    
    this.simulation.step(Math.min(deltaTime, 16.67)); // Cap at 60fps
    this.simulation.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };
  
  private lastFrameTime = 0;
}

// Module definition
const FluidSimulationModule: BackgroundModule = {
  id: 'fluid-simulation',
  name: 'Fluid Simulation',
  description: 'Interactive fluid dynamics simulation with mouse interaction',
  version: '1.0.0',
  author: 'Multi-Agent Team',
  tags: ['simulation', 'interactive', 'webgl', 'physics'],
  difficulty: 3,
  
  performance: {
    cpuIntensity: 'high',
    memoryUsage: 'medium',
    batteryImpact: 'high',
    estimatedBundleSize: 15000 // ~15KB
  },
  
  requirements: {
    webgl: true,
    canvas2d: false,
    devicePixelRatio: 1,
    minWidth: 800,
    minHeight: 600
  },
  
  init: async (canvas: HTMLCanvasElement, options: ModuleOptions) => {
    return new FluidSimulationInstance(canvas, options);
  },
  
  easterEgg: {
    id: 'fluid-master',
    difficulty: 3,
    triggers: [{
      type: 'interaction',
      data: { count: 100, type: 'mouse' }
    }],
    reward: {
      type: 'visual',
      content: 'rainbow-fluid-mode',
      duration: 10000
    },
    discoveryHint: 'Stir the fluid with passion...'
  }
};

export default FluidSimulationModule;