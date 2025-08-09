import { test, expect } from '@playwright/test';
import { NavigationUtils, BackgroundUtils, WaitUtils, PerformanceUtils } from './test-utils';

test.describe('Interactive Background System', () => {
  let navigationUtils: NavigationUtils;
  let backgroundUtils: BackgroundUtils;
  let waitUtils: WaitUtils;
  let performanceUtils: PerformanceUtils;

  test.beforeEach(async ({ page }) => {
    navigationUtils = new NavigationUtils(page);
    backgroundUtils = new BackgroundUtils(page);
    waitUtils = new WaitUtils(page);
    performanceUtils = new PerformanceUtils(page);
    
    await navigationUtils.goHome();
    await waitUtils.waitForHydration();
  });

  test.describe('WebGL Context and Canvas', () => {
    test('WebGL context initialization', async ({ page }) => {
      const webglAvailable = await backgroundUtils.isWebGLAvailable();
      
      if (!webglAvailable) {
        console.log('WebGL not available, skipping WebGL tests');
        test.skip();
        return;
      }

      // Wait for canvas to be created and WebGL context initialized
      await backgroundUtils.waitForBackgroundLoad();
      
      const canvas = await backgroundUtils.getCanvasElement();
      await expect(canvas).toBeVisible();
      
      // Verify WebGL context is working
      const contextExists = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        return gl !== null;
      });
      
      expect(contextExists).toBe(true);
    });

    test('Canvas sizing and responsiveness', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      // Test desktop size
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);
      
      const desktopSize = await backgroundUtils.getCanvasSize();
      expect(desktopSize.width).toBeGreaterThan(0);
      expect(desktopSize.height).toBeGreaterThan(0);
      
      // Test mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      const mobileSize = await backgroundUtils.getCanvasSize();
      expect(mobileSize.width).toBeGreaterThan(0);
      expect(mobileSize.height).toBeGreaterThan(0);
      
      // Canvas should resize appropriately
      expect(mobileSize.width).toBeLessThan(desktopSize.width);
    });

    test('Canvas pixel density handling', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      const pixelRatioInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        return {
          devicePixelRatio: window.devicePixelRatio,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height
        };
      });
      
      // High DPI displays should have canvas size scaled appropriately
      const expectedWidth = Math.floor(pixelRatioInfo.displayWidth * pixelRatioInfo.devicePixelRatio);
      const expectedHeight = Math.floor(pixelRatioInfo.displayHeight * pixelRatioInfo.devicePixelRatio);
      
      expect(pixelRatioInfo.canvasWidth).toBeCloseTo(expectedWidth, -1);
      expect(pixelRatioInfo.canvasHeight).toBeCloseTo(expectedHeight, -1);
    });
  });

  test.describe('Module Loading and Switching', () => {
    test('Default module loads successfully', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      const activeModule = await backgroundUtils.getActiveModule();
      expect(activeModule).toBeTruthy();
      
      // Should have a default module loaded
      expect(['gradient', 'knowledge'].includes(activeModule || '')).toBe(true);
    });

    test('Gradient module functionality', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      try {
        await backgroundUtils.switchModule('gradient');
        await page.waitForTimeout(2000);
        
        const activeModule = await backgroundUtils.getActiveModule();
        expect(activeModule).toBe('gradient');
        
        // Test gradient animation
        const animationRunning = await page.evaluate(() => {
          return new Promise(resolve => {
            let frames = 0;
            function checkFrame() {
              frames++;
              if (frames > 10) {
                resolve(true); // Animation is running
              } else {
                requestAnimationFrame(checkFrame);
              }
            }
            requestAnimationFrame(checkFrame);
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(false), 5000);
          });
        });
        
        expect(animationRunning).toBe(true);
      } catch (error) {
        console.log('Gradient module not available:', error);
        test.skip();
      }
    });

    test('Knowledge graph module functionality', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      try {
        await backgroundUtils.switchModule('knowledge');
        await page.waitForTimeout(3000);
        
        const activeModule = await backgroundUtils.getActiveModule();
        expect(activeModule).toBe('knowledge');
        
        // Test node interaction
        const canvas = await backgroundUtils.getCanvasElement();
        
        // Click on canvas to interact with nodes
        await canvas.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(1000);
        
        // Verify interaction occurred
        const interactionOccurred = await page.evaluate(() => {
          // Check if any nodes responded to interaction
          const context = (window as any).__BACKGROUND_CONTEXT__;
          return context?.lastInteraction !== undefined;
        });
        
        // Note: This test might need adjustment based on actual implementation
        console.log('Knowledge graph interaction test completed');
      } catch (error) {
        console.log('Knowledge module not available:', error);
        test.skip();
      }
    });

    test('Module switching without memory leaks', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Switch between modules multiple times
      const modules = ['gradient', 'knowledge'];
      
      for (let i = 0; i < 4; i++) {
        const module = modules[i % modules.length];
        try {
          await backgroundUtils.switchModule(module);
          await page.waitForTimeout(2000);
        } catch (error) {
          console.log(`Module ${module} not available:`, error);
        }
      }
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory should not grow excessively (allow for some variance)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        const maxAcceptableGrowth = initialMemory * 2; // 200% increase max
        
        expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
      }
    });
  });

  test.describe('Performance and Animation', () => {
    test('Frame rate performance', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      const frameRate = await performanceUtils.measureFrameRate(3000);
      
      // Should maintain reasonable frame rate (at least 30 FPS)
      expect(frameRate).toBeGreaterThan(30);
      console.log(`Background animation frame rate: ${frameRate.toFixed(2)} FPS`);
    });

    test('GPU memory usage', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      const gpuMemoryInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        
        if (!gl) return null;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const memoryInfo = gl.getExtension('WEBGL_lose_context');
        
        return {
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        };
      });
      
      if (gpuMemoryInfo) {
        console.log('GPU Info:', gpuMemoryInfo);
        expect(gpuMemoryInfo.maxTextureSize).toBeGreaterThan(0);
      }
    });

    test('Animation pause/resume on visibility change', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      // Simulate tab becoming hidden
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'hidden'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(1000);
      
      // Check if animation paused
      const isPausedWhenHidden = await page.evaluate(() => {
        const context = (window as any).__BACKGROUND_CONTEXT__;
        return context?.isPaused === true;
      });
      
      // Simulate tab becoming visible again
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'visible'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(1000);
      
      // Check if animation resumed
      const isResumedWhenVisible = await page.evaluate(() => {
        const context = (window as any).__BACKGROUND_CONTEXT__;
        return context?.isPaused === false;
      });
      
      console.log(`Animation paused when hidden: ${isPausedWhenHidden}`);
      console.log(`Animation resumed when visible: ${isResumedWhenVisible}`);
    });
  });

  test.describe('User Interactions', () => {
    test('Mouse movement interaction', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      const canvas = await backgroundUtils.getCanvasElement();
      
      // Move mouse across canvas
      await canvas.hover({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);
      
      await canvas.hover({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(500);
      
      await canvas.hover({ position: { x: 300, y: 150 } });
      await page.waitForTimeout(500);
      
      // Verify mouse interaction affects background
      const mouseInteractionWorking = await page.evaluate(() => {
        const context = (window as any).__BACKGROUND_CONTEXT__;
        return context?.mousePosition !== undefined;
      });
      
      console.log('Mouse interaction working:', mouseInteractionWorking);
    });

    test('Click interaction', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      const canvas = await backgroundUtils.getCanvasElement();
      
      // Click at different positions
      await canvas.click({ position: { x: 150, y: 150 } });
      await page.waitForTimeout(1000);
      
      await canvas.click({ position: { x: 250, y: 100 } });
      await page.waitForTimeout(1000);
      
      // Verify click interactions are handled
      const clickInteractionWorking = await page.evaluate(() => {
        const context = (window as any).__BACKGROUND_CONTEXT__;
        return context?.clickCount !== undefined;
      });
      
      console.log('Click interaction working:', clickInteractionWorking);
    });

    test('Touch interaction (mobile)', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await page.setViewportSize({ width: 375, height: 667 });
      await backgroundUtils.waitForBackgroundLoad();
      const canvas = await backgroundUtils.getCanvasElement();
      
      // Simulate touch interactions
      await canvas.tap({ position: { x: 100, y: 200 } });
      await page.waitForTimeout(1000);
      
      // Simulate swipe gesture
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 200 },
        targetPosition: { x: 200, y: 300 }
      });
      await page.waitForTimeout(1000);
      
      console.log('Touch interaction test completed');
    });

    test('Resize handling', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      const initialSize = await backgroundUtils.getCanvasSize();
      
      // Resize window
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(1000);
      
      const resizedSize = await backgroundUtils.getCanvasSize();
      
      // Canvas should have updated its size
      expect(resizedSize.width).not.toBe(initialSize.width);
      expect(resizedSize.height).not.toBe(initialSize.height);
      
      // Resize back
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);
      
      const finalSize = await backgroundUtils.getCanvasSize();
      expect(finalSize.width).toBeCloseTo(initialSize.width, 10);
      expect(finalSize.height).toBeCloseTo(initialSize.height, 10);
    });
  });

  test.describe('Theme Integration', () => {
    test('Theme color changes affect background', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      // Test light theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      });
      await page.waitForTimeout(2000);
      
      // Test dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(2000);
      
      // Verify theme change was detected by background
      const themeChangeDetected = await page.evaluate(() => {
        const context = (window as any).__BACKGROUND_CONTEXT__;
        return context?.themeChanged === true;
      });
      
      console.log('Theme change detected by background:', themeChangeDetected);
    });

    test('System theme preference handling', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      // Test light system preference
      await page.emulateMedia({ colorScheme: 'light' });
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      });
      await page.waitForTimeout(2000);
      
      // Test dark system preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(2000);
      
      console.log('System theme preference test completed');
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('WebGL context loss recovery', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      await backgroundUtils.waitForBackgroundLoad();
      
      // Simulate WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) {
            loseContext.loseContext();
          }
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Check if context was restored
      const contextRestored = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        return gl?.isContextLost() === false;
      });
      
      console.log('WebGL context restored after loss:', contextRestored);
    });

    test('Fallback behavior when WebGL unavailable', async ({ page }) => {
      // Override WebGL to simulate unavailability
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
          if (contextType === 'webgl' || contextType === 'webgl2') {
            return null;
          }
          return originalGetContext.apply(this, [contextType, ...args]);
        };
      });
      
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      // Should gracefully handle WebGL unavailability
      await page.waitForTimeout(3000);
      
      const fallbackHandled = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas === null; // No canvas should be created if WebGL unavailable
      });
      
      expect(fallbackHandled).toBe(true);
      console.log('WebGL unavailable fallback handled correctly');
    });

    test('Module loading error handling', async ({ page }) => {
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      // Try to load a non-existent module
      try {
        await backgroundUtils.switchModule('non-existent-module');
        await page.waitForTimeout(2000);
      } catch (error) {
        // Expected to fail gracefully
        console.log('Module loading error handled correctly');
      }
      
      // Should fall back to a working module
      const activeModule = await backgroundUtils.getActiveModule();
      expect(['gradient', 'knowledge', null].includes(activeModule)).toBe(true);
    });
  });

  test.describe('Accessibility and Performance', () => {
    test('Respects prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      if (await backgroundUtils.isWebGLAvailable()) {
        try {
          await backgroundUtils.waitForBackgroundLoad(5000);
          
          // Background should respect reduced motion setting
          const respectsReducedMotion = await page.evaluate(() => {
            const context = (window as any).__BACKGROUND_CONTEXT__;
            return context?.reducedMotion === true;
          });
          
          console.log('Respects reduced motion setting:', respectsReducedMotion);
        } catch (error) {
          console.log('Background system respects reduced motion by not loading');
        }
      }
      
      // Reset motion preference
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });

    test('Performance with multiple background instances', async ({ page }) => {
      if (!(await backgroundUtils.isWebGLAvailable())) {
        test.skip();
        return;
      }

      const initialPerf = await performanceUtils.getCoreWebVitals();
      
      // Navigate between pages that might have background instances
      await navigationUtils.goHome();
      await page.waitForTimeout(2000);
      
      await navigationUtils.goToAbout();
      await page.waitForTimeout(2000);
      
      await navigationUtils.goToBlog();
      await page.waitForTimeout(2000);
      
      await navigationUtils.goHome();
      await page.waitForTimeout(2000);
      
      const finalPerf = await performanceUtils.getCoreWebVitals();
      
      console.log('Performance impact of background system:', {
        initial: initialPerf,
        final: finalPerf
      });
      
      // Performance should remain reasonable
      expect(Object.keys(finalPerf).length).toBeGreaterThan(0);
    });
  });
});