/**
 * Hook for Service Worker management
 * Provides easy integration with React components
 */

import { useEffect, useState, useCallback } from 'react';
import ServiceWorkerManager, { ServiceWorkerConfig, CacheInfo } from '../utils/ServiceWorkerManager';

interface UseServiceWorkerResult {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isInstalling: boolean;
  cacheInfo: CacheInfo | null;
  registration: ServiceWorkerRegistration | null;
  skipWaiting: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  clearCache: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
  getCacheInfo: () => Promise<void>;
  promptInstall: () => Promise<void>;
}

export const useServiceWorker = (config?: Partial<ServiceWorkerConfig>): UseServiceWorkerResult => {
  const [manager, setManager] = useState<ServiceWorkerManager | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize service worker manager
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    const swConfig: Partial<ServiceWorkerConfig> = {
      onUpdate: (reg) => {
        console.log('[useServiceWorker] Update available');
        setIsUpdateAvailable(true);
        setRegistration(reg);
      },
      onInstalled: (reg) => {
        console.log('[useServiceWorker] Service worker installed');
        setIsRegistered(true);
        setIsInstalling(false);
        setRegistration(reg);
      },
      onError: (error) => {
        console.error('[useServiceWorker] Error:', error);
        setIsInstalling(false);
      },
      ...config
    };

    const swManager = new ServiceWorkerManager(swConfig);
    setManager(swManager);
    setIsSupported(true);

    // Auto-register service worker
    setIsInstalling(true);
    swManager.register().then((reg) => {
      if (reg) {
        setIsRegistered(true);
        setRegistration(reg);
      }
      setIsInstalling(false);
    }).catch((error) => {
      console.error('[useServiceWorker] Registration failed:', error);
      setIsInstalling(false);
    });

    // Cleanup on unmount
    return () => {
      swManager.destroy();
    };
  }, [config]);

  // Update state when manager changes
  useEffect(() => {
    if (manager) {
      setIsRegistered(manager.isRegistered());
      setIsUpdateAvailable(manager.isUpdateAvailable());
      setRegistration(manager.getRegistration());
    }
  }, [manager]);

  const skipWaiting = useCallback(async () => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    await manager.skipWaiting();
    setIsUpdateAvailable(false);
  }, [manager]);

  const checkForUpdates = useCallback(async () => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    await manager.checkForUpdates();
  }, [manager]);

  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    const success = await manager.clearCache();
    if (success) {
      setCacheInfo(null);
    }
    return success;
  }, [manager]);

  const unregister = useCallback(async (): Promise<boolean> => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    const success = await manager.unregister();
    if (success) {
      setIsRegistered(false);
      setIsUpdateAvailable(false);
      setRegistration(null);
      setCacheInfo(null);
    }
    return success;
  }, [manager]);

  const getCacheInfo = useCallback(async () => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    try {
      const info = await manager.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('[useServiceWorker] Failed to get cache info:', error);
      setCacheInfo(null);
    }
  }, [manager]);

  const promptInstall = useCallback(async () => {
    if (!manager) {
      throw new Error('Service worker manager not initialized');
    }
    
    await manager.getInstallPrompt();
  }, [manager]);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    isInstalling,
    cacheInfo,
    registration,
    skipWaiting,
    checkForUpdates,
    clearCache,
    unregister,
    getCacheInfo,
    promptInstall
  };
};

export default useServiceWorker;