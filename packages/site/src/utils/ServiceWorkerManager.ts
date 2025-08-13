/**
 * Service Worker Manager
 * Handles service worker registration and communication
 */

export interface ServiceWorkerConfig {
  enabled: boolean;
  swPath: string;
  scope: string;
  updateCheckInterval: number; // ms
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onInstalled?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export interface CacheInfo {
  caches: Array<{
    name: string;
    entries: number;
    urls: string[];
  }>;
  totalSize: number;
}

const DEFAULT_CONFIG: ServiceWorkerConfig = {
  enabled: true,
  swPath: '/service-worker.js',
  scope: '/',
  updateCheckInterval: 60000 // 1 minute
};

export class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: number | null = null;
  private isSupported = false;

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator &&
           'caches' in window;
  }

  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported || !this.config.enabled) {
      console.log('[ServiceWorkerManager] Service worker not supported or disabled');
      return null;
    }

    try {
      console.log('[ServiceWorkerManager] Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register(
        this.config.swPath,
        { scope: this.config.scope }
      );

      console.log('[ServiceWorkerManager] Service worker registered successfully');

      // Set up event listeners
      this.setupEventListeners();

      // Start periodic update checks
      this.startUpdateChecks();

      // Check for immediate updates
      this.checkForUpdates();

      return this.registration;
    } catch (error) {
      const swError = new Error(`Service worker registration failed: ${error}`);
      console.error('[ServiceWorkerManager]', swError);
      
      if (this.config.onError) {
        this.config.onError(swError);
      }
      
      return null;
    }
  }

  private setupEventListeners() {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('[ServiceWorkerManager] Update found');
      
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker installed, update available
            console.log('[ServiceWorkerManager] Update available');
            if (this.config.onUpdate) {
              this.config.onUpdate(this.registration!);
            }
          } else {
            // Service worker installed for the first time
            console.log('[ServiceWorkerManager] Service worker installed');
            if (this.config.onInstalled) {
              this.config.onInstalled(this.registration!);
            }
          }
        }
      });
    });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorkerManager] Controller changed, reloading page...');
      window.location.reload();
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    if (data && data.type) {
      switch (data.type) {
        case 'CACHE_UPDATED':
          console.log('[ServiceWorkerManager] Cache updated:', data.payload);
          break;
          
        case 'OFFLINE_FALLBACK':
          console.log('[ServiceWorkerManager] Offline fallback served:', data.payload);
          break;
          
        default:
          console.log('[ServiceWorkerManager] Unknown message:', data);
      }
    }
  }

  private startUpdateChecks() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }

    this.updateCheckTimer = window.setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateCheckInterval);
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      console.log('[ServiceWorkerManager] Checking for updates...');
      await this.registration.update();
    } catch (error) {
      console.error('[ServiceWorkerManager] Update check failed:', error);
    }
  }

  public async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      console.log('[ServiceWorkerManager] No waiting service worker');
      return;
    }

    try {
      // Send message to waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[ServiceWorkerManager] Skip waiting message sent');
    } catch (error) {
      console.error('[ServiceWorkerManager] Skip waiting failed:', error);
    }
  }

  public async getCacheInfo(): Promise<CacheInfo | null> {
    if (!this.registration || !this.registration.active) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_INFO' },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Cache info request timeout'));
      }, 10000);
    });
  }

  public async clearCache(): Promise<boolean> {
    if (!this.registration || !this.registration.active) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.success || false);
        }
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Clear cache request timeout'));
      }, 10000);
    });
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      // Stop update checks
      if (this.updateCheckTimer) {
        clearInterval(this.updateCheckTimer);
        this.updateCheckTimer = null;
      }

      // Unregister service worker
      const success = await this.registration.unregister();
      console.log('[ServiceWorkerManager] Service worker unregistered:', success);
      
      this.registration = null;
      return success;
    } catch (error) {
      console.error('[ServiceWorkerManager] Unregister failed:', error);
      return false;
    }
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  public isRegistered(): boolean {
    return this.registration !== null;
  }

  public isUpdateAvailable(): boolean {
    return this.registration?.waiting !== null;
  }

  public getInstallPrompt(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        reject(new Error('App is already installed'));
        return;
      }

      // Listen for beforeinstallprompt event
      const handleInstallPrompt = (e: Event) => {
        e.preventDefault();
        const installPromptEvent = e as any; // BeforeInstallPromptEvent
        
        // Show install prompt
        installPromptEvent.prompt();
        
        installPromptEvent.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[ServiceWorkerManager] App installation accepted');
            resolve();
          } else {
            console.log('[ServiceWorkerManager] App installation declined');
            reject(new Error('Installation declined'));
          }
          
          // Clean up event listener
          window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        });
      };

      window.addEventListener('beforeinstallprompt', handleInstallPrompt);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        reject(new Error('Install prompt timeout'));
      }, 30000);
    });
  }

  public destroy(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }
}

export default ServiceWorkerManager;