/**
 * Phase 4 Advanced Features - DVD Logo Bouncer Module
 * Physics-based DVD logo animation with easter egg integration
 * Optimized for <50KB bundle size and >30fps performance
 */

import { 
  BackgroundModule, 
  ModuleInstance, 
  ModuleOptions, 
  PerformanceMetrics,
  DVDLogoConfig,
  DVDLogo
} from '../../types/background';

// Physics constants
const GRAVITY = 0.3;
const BOUNCE_DAMPING = 0.85;
const FRICTION = 0.98;
const MIN_SPEED = 0.5;
const MAX_SPEED = 8.0;

// Logo configurations
const DEFAULT_LOGOS: Omit<DVDLogo, 'position' | 'velocity' | 'color'>[] = [
  {
    id: 'dvd-classic',
    texture: 'DVD',
    width: 120,
    height: 60
  },
  {
    id: 'claude',
    texture: 'CLAUDE',
    width: 140,
    height: 50
  },
  {
    id: 'webgl',
    texture: 'WebGL',
    width: 100,
    height: 40
  },
  {
    id: 'react',
    texture: 'React',
    width: 110,
    height: 45
  }
];

// Color palette
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9'  // Sky Blue
];

// WebGL shaders for optimized rendering
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_color;
  attribute float a_alpha;
  
  uniform vec2 u_resolution;
  uniform mat3 u_transform;
  
  varying vec2 v_texCoord;
  varying vec3 v_color;
  varying float v_alpha;
  
  void main() {
    vec3 position = u_transform * vec3(a_position, 1.0);
    
    // Convert to clip space
    vec2 clipSpace = ((position.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
    v_alpha = a_alpha;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform bool u_useTexture;
  uniform float u_time;
  uniform bool u_easterEgg;
  
  varying vec2 v_texCoord;
  varying vec3 v_color;
  varying float v_alpha;
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec3 color = v_color;
    float alpha = v_alpha;
    
    if (u_useTexture) {
      vec4 texColor = texture2D(u_texture, v_texCoord);
      color = mix(color, texColor.rgb, texColor.a);
      alpha *= texColor.a;
    }
    
    // Easter egg rainbow effect
    if (u_easterEgg) {
      float hue = fract(v_texCoord.x * 2.0 + v_texCoord.y + u_time * 0.5);
      vec3 rainbow = hsv2rgb(vec3(hue, 0.8, 1.0));
      color = mix(color, rainbow, 0.6);
      
      // Pulsing effect
      float pulse = (sin(u_time * 3.0) * 0.5 + 0.5) * 0.3 + 0.7;
      alpha *= pulse;
    }
    
    // Edge glow effect
    vec2 center = abs(v_texCoord - 0.5) * 2.0;
    float edge = 1.0 - max(center.x, center.y);
    float glow = smoothstep(0.0, 0.3, edge);
    
    color += vec3(glow * 0.2);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Text rendering utility
class TextRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textureCache = new Map<string, HTMLCanvasElement>();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  createTextTexture(text: string, width: number, height: number, color: string): HTMLCanvasElement {
    const key = `${text}_${width}_${height}_${color}`;
    
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    
    // Clear background
    ctx.clearRect(0, 0, width, height);
    
    // Set font properties
    const fontSize = Math.min(width / text.length * 1.2, height * 0.7);
    ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add stroke for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = Math.max(1, fontSize / 20);
    
    // Draw text with stroke
    ctx.strokeText(text, width / 2, height / 2);
    ctx.fillText(text, width / 2, height / 2);
    
    this.textureCache.set(key, canvas);
    return canvas;
  }

  cleanup() {
    this.textureCache.clear();
  }
}

// DVD Logo bouncer simulation
class DVDLogoBouncer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private config: DVDLogoConfig;
  private textRenderer: TextRenderer;
  
  private logos: DVDLogo[] = [];
  private program!: WebGLProgram;
  private vertexBuffer!: WebGLBuffer;
  private texCoordBuffer!: WebGLBuffer;
  private colorBuffer!: WebGLBuffer;
  private indexBuffer!: WebGLBuffer;
  
  private textures = new Map<string, WebGLTexture>();
  
  private cornerHitCount = 0;
  private lastCornerHit = 0;
  private easterEggMode = false;
  private easterEggStartTime = 0;
  
  private frameCount = 0;
  private lastFrameTime = 0;

  // Store bound event listeners for proper cleanup
  private boundHandleContextLost: (event: Event) => void;
  private boundHandleContextRestored: () => void;

  constructor(canvas: HTMLCanvasElement, config: DVDLogoConfig) {
    this.canvas = canvas;
    this.config = config;
    this.textRenderer = new TextRenderer();
    
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    });
    
    if (!gl) {
      throw new Error('WebGL not supported for DVD Logo Bouncer');
    }
    
    this.gl = gl as WebGLRenderingContext;
    
    // Bind event handlers for proper cleanup
    this.boundHandleContextLost = this.handleContextLost.bind(this);
    this.boundHandleContextRestored = this.handleContextRestored.bind(this);
    
    // Add WebGL context loss handling
    this.setupContextLossHandling();
    
    this.initializeGL();
    this.createLogos();
    this.setupInteraction();
  }

  private setupContextLossHandling() {
    // Handle WebGL context loss
    this.canvas.addEventListener('webglcontextlost', this.boundHandleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.boundHandleContextRestored, false);
  }

  private handleContextLost(event: Event) {
    event.preventDefault();
    console.warn('DVDLogoBouncer: WebGL context lost');
    
    // Clear WebGL resources (they're automatically invalid now)
    this.textures.clear();
    
    // Notify instance about context loss
    if (this.onContextLost) {
      this.onContextLost();
    }
  }

  private handleContextRestored() {
    console.log('DVDLogoBouncer: WebGL context restored, reinitializing...');
    
    try {
      // Reinitialize WebGL resources
      this.initializeGL();
      this.createLogos();
      
      // Notify instance about context restoration
      if (this.onContextRestored) {
        this.onContextRestored();
      }
    } catch (error) {
      console.error('DVDLogoBouncer: Failed to restore WebGL context:', error);
    }
  }

  // Callback properties for context loss handling
  public onContextLost?: () => void;
  public onContextRestored?: () => void;
  
  private initializeGL() {
    const gl = this.gl;
    
    // Create shader program
    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    
    // Create buffers
    this.vertexBuffer = gl.createBuffer()!;
    this.texCoordBuffer = gl.createBuffer()!;
    this.colorBuffer = gl.createBuffer()!;
    this.indexBuffer = gl.createBuffer()!;
    
    // Set up index buffer (same for all quads)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
  
  private createLogos() {
    const logoCount = this.config.logos.length || Math.min(4, DEFAULT_LOGOS.length);
    
    for (let i = 0; i < logoCount; i++) {
      const logoConfig = this.config.logos[i] || DEFAULT_LOGOS[i];
      
      const logo: DVDLogo = {
        ...logoConfig,
        position: {
          x: Math.random() * (this.canvas.width - logoConfig.width),
          y: Math.random() * (this.canvas.height - logoConfig.height)
        },
        velocity: {
          x: (Math.random() - 0.5) * this.config.physics.speed,
          y: (Math.random() - 0.5) * this.config.physics.speed
        },
        color: this.config.colors[i % this.config.colors.length] || COLORS[i % COLORS.length]
      };
      
      // Ensure minimum speed
      if (Math.abs(logo.velocity.x) < MIN_SPEED) {
        logo.velocity.x = logo.velocity.x > 0 ? MIN_SPEED : -MIN_SPEED;
      }
      if (Math.abs(logo.velocity.y) < MIN_SPEED) {
        logo.velocity.y = logo.velocity.y > 0 ? MIN_SPEED : -MIN_SPEED;
      }
      
      this.logos.push(logo);
      
      // Create texture for this logo
      this.createLogoTexture(logo);
    }
  }
  
  private createLogoTexture(logo: DVDLogo) {
    const gl = this.gl;
    
    const textCanvas = this.textRenderer.createTextTexture(
      logo.texture, 
      logo.width, 
      logo.height, 
      logo.color
    );
    
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    
    // Use linear filtering for smooth scaling
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    this.textures.set(logo.id, texture);
  }
  
  private setupInteraction() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Add a new logo at click position
      if (this.logos.length < 10) {
        const newLogo: DVDLogo = {
          id: `logo-${Date.now()}`,
          texture: 'CLICK',
          width: 80,
          height: 40,
          position: { x: x - 40, y: y - 20 },
          velocity: {
            x: (Math.random() - 0.5) * this.config.physics.speed * 2,
            y: (Math.random() - 0.5) * this.config.physics.speed * 2
          },
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        
        this.logos.push(newLogo);
        this.createLogoTexture(newLogo);
      }
    });
  }
  
  public step(deltaTime: number) {
    const dt = Math.min(deltaTime * 0.016, 1); // Cap at reasonable delta
    
    this.logos.forEach(logo => {
      // Apply physics
      if (this.config.physics.gravity > 0) {
        logo.velocity.y += this.config.physics.gravity * dt;
      }
      
      // Update position
      logo.position.x += logo.velocity.x * dt;
      logo.position.y += logo.velocity.y * dt;
      
      // Bounce off walls
      let bounced = false;
      
      // Horizontal bounces
      if (logo.position.x <= 0) {
        logo.position.x = 0;
        logo.velocity.x = Math.abs(logo.velocity.x) * this.config.physics.bounce;
        bounced = true;
      } else if (logo.position.x + logo.width >= this.canvas.width) {
        logo.position.x = this.canvas.width - logo.width;
        logo.velocity.x = -Math.abs(logo.velocity.x) * this.config.physics.bounce;
        bounced = true;
      }
      
      // Vertical bounces
      if (logo.position.y <= 0) {
        logo.position.y = 0;
        logo.velocity.y = Math.abs(logo.velocity.y) * this.config.physics.bounce;
        bounced = true;
      } else if (logo.position.y + logo.height >= this.canvas.height) {
        logo.position.y = this.canvas.height - logo.height;
        logo.velocity.y = -Math.abs(logo.velocity.y) * this.config.physics.bounce;
        bounced = true;
      }
      
      // Check for corner hits (easter egg trigger)
      if (bounced) {
        const atCorner = (
          (logo.position.x <= 1 || logo.position.x + logo.width >= this.canvas.width - 1) &&
          (logo.position.y <= 1 || logo.position.y + logo.height >= this.canvas.height - 1)
        );
        
        if (atCorner) {
          const now = Date.now();
          if (now - this.lastCornerHit > 1000) { // Prevent rapid counting
            this.cornerHitCount++;
            this.lastCornerHit = now;
            
            // Easter egg trigger
            if (this.cornerHitCount >= 3 && !this.easterEggMode) {
              this.easterEggMode = true;
              this.easterEggStartTime = now;
              console.log('🎉 DVD Corner Hit Easter Egg Activated!');
            }
          }
        }
        
        // Change color on bounce if enabled
        if (this.config.colorChangeOnBounce) {
          logo.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          this.createLogoTexture(logo); // Recreate texture with new color
        }
      }
      
      // Apply friction
      logo.velocity.x *= FRICTION;
      logo.velocity.y *= FRICTION;
      
      // Maintain minimum speed
      if (Math.abs(logo.velocity.x) < MIN_SPEED) {
        logo.velocity.x = logo.velocity.x > 0 ? MIN_SPEED : -MIN_SPEED;
      }
      if (Math.abs(logo.velocity.y) < MIN_SPEED) {
        logo.velocity.y = logo.velocity.y > 0 ? MIN_SPEED : -MIN_SPEED;
      }
      
      // Cap maximum speed
      const speed = Math.sqrt(logo.velocity.x ** 2 + logo.velocity.y ** 2);
      if (speed > MAX_SPEED) {
        logo.velocity.x = (logo.velocity.x / speed) * MAX_SPEED;
        logo.velocity.y = (logo.velocity.y / speed) * MAX_SPEED;
      }
    });
    
    // Auto-disable easter egg after duration
    if (this.easterEggMode && Date.now() - this.easterEggStartTime > 10000) {
      this.easterEggMode = false;
    }
    
    this.frameCount++;
  }
  
  public render() {
    const gl = this.gl;
    
    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_resolution'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_time'), Date.now() * 0.001);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_easterEgg'), this.easterEggMode ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_useTexture'), 1);
    
    // Render each logo
    this.logos.forEach(logo => {
      this.renderLogo(logo);
    });
  }
  
  private renderLogo(logo: DVDLogo) {
    const gl = this.gl;
    
    // Create quad vertices
    const x1 = logo.position.x;
    const y1 = logo.position.y;
    const x2 = x1 + logo.width;
    const y2 = y1 + logo.height;
    
    const vertices = new Float32Array([
      x1, y1,  // Top left
      x2, y1,  // Top right
      x2, y2,  // Bottom right
      x1, y2   // Bottom left
    ]);
    
    const texCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]);
    
    // Parse color
    const color = this.hexToRgb(logo.color);
    const colors = new Float32Array([
      color.r, color.g, color.b,
      color.r, color.g, color.b,
      color.r, color.g, color.b,
      color.r, color.g, color.b
    ]);
    
    // Bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    const colorLocation = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    
    // Bind texture
    const texture = this.textures.get(logo.id);
    if (texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(this.program, 'u_texture'), 0);
    }
    
    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
  }
  
  public getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    const fps = deltaTime > 0 ? 1000 / deltaTime : 60;
    
    return {
      fps: Math.round(fps),
      memoryUsage: this.logos.length * 0.5, // Rough estimate
      cpuUsage: Math.min(100, Math.max(0, (60 - fps) * 2)),
      renderTime: deltaTime,
      timestamp: now
    };
  }
  
  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }
  
  public cleanup() {
    // Remove event listeners first
    this.canvas.removeEventListener('webglcontextlost', this.boundHandleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.boundHandleContextRestored);
    
    // Clear callbacks
    this.onContextLost = undefined;
    this.onContextRestored = undefined;
    
    const gl = this.gl;
    
    // Cleanup WebGL resources
    this.textures.forEach(texture => gl.deleteTexture(texture));
    this.textures.clear();
    
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.texCoordBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteProgram(this.program);
    
    this.textRenderer.cleanup();
  }
}

// Module instance
class DVDLogoBouncerInstance implements ModuleInstance {
  private bouncer: DVDLogoBouncer;
  private animationId: number | null = null;
  private isRunning = false;
  private isPaused = false;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, options: ModuleOptions) {
    const config: DVDLogoConfig = {
      logos: DEFAULT_LOGOS.slice(0, options.performance === 'high' ? 4 : options.performance === 'medium' ? 2 : 1).map(logo => ({
        ...logo,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        color: COLORS[0]
      })),
      physics: {
        speed: options.performance === 'high' ? 4.0 : options.performance === 'medium' ? 3.0 : 2.0,
        bounce: BOUNCE_DAMPING,
        gravity: 0
      },
      colors: COLORS,
      colorChangeOnBounce: true
    };
    
    this.bouncer = new DVDLogoBouncer(canvas, config);
    
    // Set up context loss callbacks
    this.bouncer.onContextLost = () => {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    };
    
    this.bouncer.onContextRestored = () => {
      // Restart animation if it was running
      if (this.isRunning && !this.animationId) {
        this.animate();
      }
    };
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
    this.bouncer.resize(width, height);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.bouncer.getPerformanceMetrics();
  }

  destroy() {
    this.stop();
    this.bouncer.cleanup();
  }

  private animate = (currentTime: number = 0) => {
    if (!this.isRunning || this.isPaused) return;
    
    const deltaTime = currentTime - (this.lastFrameTime || currentTime);
    this.lastFrameTime = currentTime;
    
    this.bouncer.step(deltaTime);
    this.bouncer.render();
    
    this.animationId = requestAnimationFrame(this.animate);
  };
}

// Module definition
const DVDLogoBouncerModule: BackgroundModule = {
  id: 'dvd-logo-bouncer',
  name: 'DVD Logo Bouncer',
  description: 'Classic DVD logo bouncing animation with physics and easter eggs',
  version: '1.0.0',
  author: 'Multi-Agent Team',
  tags: ['animation', 'interactive', 'physics', 'nostalgia', 'webgl'],
  difficulty: 2,
  
  performance: {
    cpuIntensity: 'medium',
    memoryUsage: 'low',
    batteryImpact: 'low',
    estimatedBundleSize: 22000 // ~22KB
  },
  
  requirements: {
    webgl: true,
    canvas2d: false,
    devicePixelRatio: 1,
    minWidth: 400,
    minHeight: 300
  },
  
  init: async (canvas: HTMLCanvasElement, options: ModuleOptions) => {
    return new DVDLogoBouncerInstance(canvas, options);
  },
  
  easterEgg: {
    id: 'corner-hunter',
    difficulty: 3,
    triggers: [{
      type: 'interaction',
      data: { count: 3, type: 'corner-hits' }
    }],
    reward: {
      type: 'visual',
      content: 'rainbow-logo-mode',
      duration: 10000
    },
    discoveryHint: 'Wait for the perfect corner collision...'
  }
};

export default DVDLogoBouncerModule;
export { DEFAULT_LOGOS, COLORS };
