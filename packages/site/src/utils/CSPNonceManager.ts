/**
 * CSP Nonce Manager
 * Handles Content Security Policy nonce generation and management
 */

import crypto from 'crypto';

export interface CSPNonceConfig {
  enabled: boolean;
  nonceLength: number;
  refreshInterval: number; // ms
  storage: 'memory' | 'sessionStorage' | 'localStorage';
}

const DEFAULT_CONFIG: CSPNonceConfig = {
  enabled: true,
  nonceLength: 32,
  refreshInterval: 300000, // 5 minutes
  storage: 'memory'
};

export class CSPNonceManager {
  private config: CSPNonceConfig;
  private currentNonce: string = '';
  private refreshTimer: number | null = null;
  private isServer: boolean;

  constructor(config: Partial<CSPNonceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isServer = typeof window === 'undefined';
    
    if (this.config.enabled) {
      this.generateNonce();
      this.startRefreshTimer();
    }
  }

  /**
   * Generate a new cryptographically secure nonce
   */
  private generateNonce(): void {
    try {
      if (this.isServer) {
        // Server-side: Use Node.js crypto
        this.currentNonce = crypto.randomBytes(this.config.nonceLength).toString('base64');
      } else {
        // Client-side: Use Web Crypto API or fallback
        if (window.crypto && window.crypto.getRandomValues) {
          const bytes = new Uint8Array(this.config.nonceLength);
          window.crypto.getRandomValues(bytes);
          this.currentNonce = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
        } else {
          // Fallback for older browsers
          this.currentNonce = this.generateFallbackNonce();
        }
      }
      
      // Store nonce if configured
      this.storeNonce();
      
      console.log('[CSPNonceManager] New nonce generated');
    } catch (error) {
      console.error('[CSPNonceManager] Nonce generation failed:', error);
      this.currentNonce = this.generateFallbackNonce();
    }
  }

  /**
   * Fallback nonce generation for environments without crypto support
   */
  private generateFallbackNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    
    for (let i = 0; i < this.config.nonceLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.warn('[CSPNonceManager] Using fallback nonce generation');
    return result;
  }

  /**
   * Store nonce according to configuration
   */
  private storeNonce(): void {
    if (this.isServer || this.config.storage === 'memory') {
      return; // Memory storage is default, no action needed
    }

    try {
      const storageKey = 'csp-nonce';
      const nonceData = {
        nonce: this.currentNonce,
        timestamp: Date.now()
      };

      if (this.config.storage === 'sessionStorage') {
        sessionStorage.setItem(storageKey, JSON.stringify(nonceData));
      } else if (this.config.storage === 'localStorage') {
        localStorage.setItem(storageKey, JSON.stringify(nonceData));
      }
    } catch (error) {
      console.warn('[CSPNonceManager] Storage failed:', error);
    }
  }

  /**
   * Retrieve stored nonce
   */
  private retrieveStoredNonce(): string | null {
    if (this.isServer || this.config.storage === 'memory') {
      return null;
    }

    try {
      const storageKey = 'csp-nonce';
      let stored: string | null = null;

      if (this.config.storage === 'sessionStorage') {
        stored = sessionStorage.getItem(storageKey);
      } else if (this.config.storage === 'localStorage') {
        stored = localStorage.getItem(storageKey);
      }

      if (stored) {
        const nonceData = JSON.parse(stored);
        const age = Date.now() - nonceData.timestamp;
        
        // Check if nonce is still valid
        if (age < this.config.refreshInterval) {
          return nonceData.nonce;
        }
      }
    } catch (error) {
      console.warn('[CSPNonceManager] Nonce retrieval failed:', error);
    }

    return null;
  }

  /**
   * Start automatic nonce refresh timer
   */
  private startRefreshTimer(): void {
    if (this.isServer) return;

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = window.setInterval(() => {
      this.generateNonce();
    }, this.config.refreshInterval);
  }

  /**
   * Get current nonce value
   */
  public getNonce(): string {
    if (!this.config.enabled) {
      return '';
    }

    // Try to retrieve from storage first
    const storedNonce = this.retrieveStoredNonce();
    if (storedNonce) {
      this.currentNonce = storedNonce;
    } else if (!this.currentNonce) {
      this.generateNonce();
    }

    return this.currentNonce;
  }

  /**
   * Force regenerate nonce
   */
  public refreshNonce(): void {
    this.generateNonce();
  }

  /**
   * Get nonce for use in HTML attributes
   */
  public getNonceAttribute(): string {
    const nonce = this.getNonce();
    return nonce ? `nonce="${nonce}"` : '';
  }

  /**
   * Get nonce for use in CSP header
   */
  public getCSPNonce(): string {
    const nonce = this.getNonce();
    return nonce ? `'nonce-${nonce}'` : '';
  }

  /**
   * Apply nonce to script element
   */
  public applyToScript(script: HTMLScriptElement): void {
    const nonce = this.getNonce();
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }
  }

  /**
   * Apply nonce to style element
   */
  public applyToStyle(style: HTMLStyleElement): void {
    const nonce = this.getNonce();
    if (nonce) {
      style.setAttribute('nonce', nonce);
    }
  }

  /**
   * Create script element with nonce
   */
  public createScript(src?: string): HTMLScriptElement {
    const script = document.createElement('script');
    if (src) {
      script.src = src;
    }
    this.applyToScript(script);
    return script;
  }

  /**
   * Create style element with nonce
   */
  public createStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    this.applyToStyle(style);
    return style;
  }

  /**
   * Update CSP meta tag with current nonce
   */
  public updateCSPMetaTag(): void {
    if (this.isServer) return;

    const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement;
    if (metaTag && metaTag.content) {
      const nonce = this.getNonce();
      if (nonce) {
        // Replace placeholder nonce with actual nonce
        metaTag.content = metaTag.content.replace(
          /'nonce-\{NONCE\}'/g,
          `'nonce-${nonce}'`
        );
      }
    }
  }

  /**
   * Validate nonce format
   */
  public isValidNonce(nonce: string): boolean {
    // Base64 characters + padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(nonce) && nonce.length >= 16;
  }

  /**
   * Get nonce metadata
   */
  public getMetadata() {
    return {
      enabled: this.config.enabled,
      nonceLength: this.config.nonceLength,
      refreshInterval: this.config.refreshInterval,
      storage: this.config.storage,
      currentNonceLength: this.currentNonce.length,
      isValid: this.isValidNonce(this.currentNonce)
    };
  }

  /**
   * Destroy nonce manager
   */
  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Clear stored nonce
    if (!this.isServer && this.config.storage !== 'memory') {
      try {
        const storageKey = 'csp-nonce';
        if (this.config.storage === 'sessionStorage') {
          sessionStorage.removeItem(storageKey);
        } else if (this.config.storage === 'localStorage') {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn('[CSPNonceManager] Cleanup failed:', error);
      }
    }

    this.currentNonce = '';
  }
}

// Global instance for easy access
let globalNonceManager: CSPNonceManager | null = null;

/**
 * Get or create global nonce manager instance
 */
export function getCSPNonceManager(config?: Partial<CSPNonceConfig>): CSPNonceManager {
  if (!globalNonceManager) {
    globalNonceManager = new CSPNonceManager(config);
  }
  return globalNonceManager;
}

/**
 * Utility function to get current nonce
 */
export function getCurrentNonce(): string {
  return getCSPNonceManager().getNonce();
}

/**
 * Utility function to get nonce attribute string
 */
export function getNonceAttribute(): string {
  return getCSPNonceManager().getNonceAttribute();
}

export default CSPNonceManager;