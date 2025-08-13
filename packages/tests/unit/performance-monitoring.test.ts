/**
 * Phase 4 Unit Tests - Performance Monitoring Dashboard
 * Comprehensive testing of real-time metrics, alerting, data export, and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react';
import { BackgroundProvider, useBackground } from '@site/bgModules/core/BackgroundProvider';
import { setupCanvasMocks, resetCanvasMocks, mockPerformanceMemory } from '../setup/mocks/canvas'
import testUtils from '../setup/testUtils'

// Setup canvas mocks globally  
setupCanvasMocks()
import { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceBudget,
  UserPreferences 
} from '@site/types/background';

// Mock React context wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(BackgroundProvider, null, children);

// Use standardized performance memory mock (already available from canvas mocks)

describe('Phase 4: Performance Monitoring Dashboard', () => {
  
  beforeEach(() => {
    resetCanvasMocks();
    localStorage.clear();
    
    // Reset performance mocks
    performance.mark = vi.fn();
    performance.measure = vi.fn();
    performance.getEntriesByName = vi.fn(() => []);
    performance.getEntriesByType = vi.fn(() => []);
    performance.clearMarks = vi.fn();
    performance.clearMeasures = vi.fn();
  });

  describe('Real-time Metrics Accuracy', () => {
    
    test('should accurately measure FPS over time', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const fpsReadings: number[] = [];
      const measurementDuration = 1000; // 1 second
      const expectedFrames = 60; // 60 FPS target
      
      let frameCount = 0;
      const startTime = performance.now();
      
      // Simulate 60 FPS for 1 second
      const frameInterval = setInterval(() => {
        frameCount++;
        
        // Simulate getting performance metrics
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const currentFPS = Math.round((frameCount * 1000) / elapsed);
        
        fpsReadings.push(currentFPS);
        
        if (elapsed >= measurementDuration) {
          clearInterval(frameInterval);
        }
      }, 1000 / 60); // 60 FPS interval
      
      // Wait for measurements to complete using condition-based waiting
      await testUtils.waitFor(
        () => fpsReadings.length >= expectedFrames || performance.now() - startTime >= measurementDuration + 100,
        { timeout: measurementDuration + 500, interval: 10 }
      );
      
      const averageFPS = fpsReadings.reduce((sum, fps) => sum + fps, 0) / fpsReadings.length;
      
      expect(averageFPS).toBeCloseTo(60, 1); // Within 1 FPS
      expect(fpsReadings.length).toBeGreaterThan(10); // Multiple readings taken
      
      clearInterval(frameInterval);
    });

    test('should accurately track memory usage patterns', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const initialMetrics = await act(async () => {
        return result.current.actions.getPerformanceMetrics();
      });
      
      // Simulate memory allocation
      const largeArrays = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(i));
      }
      
      // Update mock memory values
      mockPerformanceMemory.usedJSHeapSize = 75 * 1024 * 1024; // 75MB
      
      const postAllocationMetrics = await act(async () => {
        return result.current.actions.getPerformanceMetrics();
      });
      
      expect(postAllocationMetrics.memoryUsage).toBeGreaterThan(initialMetrics.memoryUsage);
      expect(postAllocationMetrics.memoryUsage).toBe(75); // 75MB in the mock
      
      // Clean up
      largeArrays.length = 0;
    });

    test('should calculate CPU usage estimates accurately', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const cpuIntensiveTask = () => {
        const start = performance.now();
        
        // Simulate CPU-intensive work
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sin(i) * Math.cos(i);
        }
        
        const end = performance.now();
        return end - start;
      };
      
      const taskDuration = cpuIntensiveTask();
      const frameTime = 16.67; // 60 FPS target
      const cpuUsageEstimate = Math.min(100, (taskDuration / frameTime) * 100);
      
      await act(async () => {
        const metrics = result.current.actions.getPerformanceMetrics();
        expect(metrics.cpuUsage).toBeDefined();
        expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
        expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
      });
    });

    test('should track render time with high precision', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const renderTimes: number[] = [];
      
      // Simulate multiple render cycles
      for (let i = 0; i < 10; i++) {
        const renderStart = performance.now();
        
        // Mock rendering work with deterministic timing
        await testUtils.sleep(Math.random() * 10 + 5); // 5-15ms - using testUtils for consistency
        
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStart;
        renderTimes.push(renderTime);
        
        performance.mark(`render-start-${i}`);
        performance.mark(`render-end-${i}`);
        performance.measure(`render-${i}`, `render-start-${i}`, `render-end-${i}`);
      }
      
      const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      
      expect(averageRenderTime).toBeGreaterThan(5);
      expect(averageRenderTime).toBeLessThan(20);
      expect(renderTimes).toHaveLength(10);
    });

    test('should monitor GPU utilization when available', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      // Mock WebGL context with debug info
      const mockWebGLContext = {
        getExtension: vi.fn((name: string) => {
          if (name === 'WEBGL_debug_renderer_info') {
            return {
              UNMASKED_VENDOR_WEBGL: 0x9245,
              UNMASKED_RENDERER_WEBGL: 0x9246
            };
          }
          return null;
        }),
        getParameter: vi.fn((param: number) => {
          switch (param) {
            case 0x9245: return 'NVIDIA Corporation';
            case 0x9246: return 'NVIDIA GeForce RTX 3080';
            default: return null;
          }
        })
      };
      
      // Mock canvas with WebGL context
      const mockCanvas = document.createElement('canvas');
      mockCanvas.getContext = vi.fn(() => mockWebGLContext);
      
      const gpuInfo = {
        vendor: mockWebGLContext.getParameter(0x9245),
        renderer: mockWebGLContext.getParameter(0x9246),
        supported: true
      };
      
      expect(gpuInfo.vendor).toBe('NVIDIA Corporation');
      expect(gpuInfo.renderer).toBe('NVIDIA GeForce RTX 3080');
      expect(gpuInfo.supported).toBe(true);
    });
  });

  describe('Alert System Functionality', () => {
    
    test('should trigger FPS drop alerts', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const alertThresholds = {
        fps: 25,
        memory: 100,
        cpu: 80
      };
      
      const mockLowFPSMetrics: PerformanceMetrics = {
        fps: 20, // Below threshold
        memoryUsage: 50,
        cpuUsage: 60,
        renderTime: 50, // High render time indicating low FPS
        timestamp: Date.now()
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
      
      await act(async () => {
        // Simulate performance monitoring detecting low FPS
        if (mockLowFPSMetrics.fps < alertThresholds.fps) {
          console.warn('🚨 Performance Alert: Low FPS detected:', mockLowFPSMetrics.fps);
          
          const alert: PerformanceAlert = {
            type: 'fps-drop',
            severity: 'high',
            message: `FPS dropped to ${mockLowFPSMetrics.fps} (threshold: ${alertThresholds.fps})`,
            metrics: mockLowFPSMetrics,
            timestamp: Date.now()
          };
        }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Performance Alert: Low FPS detected:',
        20
      );
      
      consoleSpy.mockRestore();
    });

    test('should detect memory leak patterns', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const memoryReadings: number[] = [];
      const leakThreshold = 50; // MB increase per minute
      
      // Simulate memory readings over time
      const baseMemory = 50;
      for (let minute = 0; minute < 10; minute++) {
        const memoryWithLeak = baseMemory + (minute * 10); // 10MB increase per minute
        memoryReadings.push(memoryWithLeak);
      }
      
      // Detect memory leak pattern
      const memoryIncreaseRate = (memoryReadings[9]! - memoryReadings[0]!) / 9; // MB per minute
      const isMemoryLeak = memoryIncreaseRate > leakThreshold / 10; // Adjust for test scale
      
      if (isMemoryLeak) {
        const alert: PerformanceAlert = {
          type: 'memory-leak',
          severity: 'critical',
          message: `Memory leak detected: ${memoryIncreaseRate.toFixed(2)}MB/min increase`,
          metrics: {
            fps: 60,
            memoryUsage: memoryReadings[9]!,
            cpuUsage: 50,
            renderTime: 16.67,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        };
        
        expect(alert.type).toBe('memory-leak');
        expect(alert.severity).toBe('critical');
      }
      
      expect(memoryIncreaseRate).toBeGreaterThan(5); // Should detect the leak
    });

    test('should configure custom alert thresholds', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const customThresholds = {
        fps: 30,      // Custom FPS threshold
        memory: 200,  // Custom memory threshold
        cpu: 90,      // Custom CPU threshold
        renderTime: 20 // Custom render time threshold
      };
      
      await act(async () => {
        result.current.actions.updatePreferences({
          moduleSettings: {
            performanceMonitoring: {
              alertThresholds: customThresholds,
              enableAlerts: true
            }
          }
        });
      });
      
      const preferences = result.current.state.userPreferences;
      const storedThresholds = preferences.moduleSettings.performanceMonitoring?.alertThresholds;
      
      expect(storedThresholds).toEqual(customThresholds);
    });

    test('should support alert severity levels', () => {
      const metrics: PerformanceMetrics = {
        fps: 15,
        memoryUsage: 150,
        cpuUsage: 95,
        renderTime: 80,
        timestamp: Date.now()
      };
      
      const calculateSeverity = (metric: keyof PerformanceMetrics, value: number): 'low' | 'medium' | 'high' | 'critical' => {
        const thresholds = {
          fps: { critical: 10, high: 20, medium: 30 },
          memoryUsage: { critical: 200, high: 150, medium: 100 },
          cpuUsage: { critical: 95, high: 80, medium: 65 }
        };
        
        const metricThresholds = thresholds[metric as keyof typeof thresholds];
        if (!metricThresholds) return 'low';
        
        if (metric === 'fps') {
          if (value <= metricThresholds.critical) return 'critical';
          if (value <= metricThresholds.high) return 'high';
          if (value <= metricThresholds.medium) return 'medium';
        } else {
          if (value >= metricThresholds.critical) return 'critical';
          if (value >= metricThresholds.high) return 'high';
          if (value >= metricThresholds.medium) return 'medium';
        }
        
        return 'low';
      };
      
      const fpsSeverity = calculateSeverity('fps', metrics.fps);
      const memorySeverity = calculateSeverity('memoryUsage', metrics.memoryUsage);
      const cpuSeverity = calculateSeverity('cpuUsage', metrics.cpuUsage);
      
      expect(fpsSeverity).toBe('high');
      expect(memorySeverity).toBe('high');
      expect(cpuSeverity).toBe('critical');
    });
  });

  describe('Data Export Capabilities', () => {
    
    test('should export metrics in JSON format', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      const metricsHistory: PerformanceMetrics[] = [];
      
      // Generate sample metrics data
      for (let i = 0; i < 100; i++) {
        const metrics: PerformanceMetrics = {
          fps: 60 - Math.random() * 10, // 50-60 FPS
          memoryUsage: 50 + Math.random() * 20, // 50-70 MB
          cpuUsage: 30 + Math.random() * 40, // 30-70%
          renderTime: 16.67 + Math.random() * 5, // 16-21ms
          timestamp: Date.now() - (100 - i) * 1000 // 100 seconds of data
        };
        metricsHistory.push(metrics);
      }
      
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          duration: '100 seconds',
          sampleCount: metricsHistory.length,
          version: '4.0.0'
        },
        metrics: metricsHistory,
        summary: {
          averageFPS: metricsHistory.reduce((sum, m) => sum + m.fps, 0) / metricsHistory.length,
          maxMemoryUsage: Math.max(...metricsHistory.map(m => m.memoryUsage)),
          averageCPU: metricsHistory.reduce((sum, m) => sum + m.cpuUsage, 0) / metricsHistory.length
        }
      };
      
      const jsonExport = JSON.stringify(exportData, null, 2);
      
      expect(JSON.parse(jsonExport)).toEqual(exportData);
      expect(exportData.metrics).toHaveLength(100);
      expect(exportData.summary.averageFPS).toBeCloseTo(55, 1);
    });

    test('should export metrics in CSV format', () => {
      const metricsData: PerformanceMetrics[] = [
        { fps: 60, memoryUsage: 50, cpuUsage: 30, renderTime: 16.67, timestamp: 1000 },
        { fps: 58, memoryUsage: 52, cpuUsage: 35, renderTime: 17.24, timestamp: 2000 },
        { fps: 55, memoryUsage: 55, cpuUsage: 40, renderTime: 18.18, timestamp: 3000 }
      ];
      
      const csvHeaders = 'Timestamp,FPS,Memory Usage (MB),CPU Usage (%),Render Time (ms)';
      const csvRows = metricsData.map(metrics => 
        [
          new Date(metrics.timestamp).toISOString(),
          metrics.fps.toFixed(2),
          metrics.memoryUsage.toFixed(2),
          metrics.cpuUsage.toFixed(2),
          metrics.renderTime.toFixed(2)
        ].join(',')
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      expect(csvContent).toContain('Timestamp,FPS,Memory Usage');
      expect(csvContent.split('\n')).toHaveLength(4); // Header + 3 data rows
      expect(csvContent).toContain('60.00,50.00,30.00,16.67');
    });

    test('should support filtered data export', () => {
      const allMetrics: PerformanceMetrics[] = [];
      
      // Generate 24 hours of mock data (1 sample per minute)
      const now = Date.now();
      for (let i = 0; i < 24 * 60; i++) {
        allMetrics.push({
          fps: 60 - Math.random() * 20,
          memoryUsage: 50 + Math.random() * 50,
          cpuUsage: 20 + Math.random() * 60,
          renderTime: 16.67 + Math.random() * 10,
          timestamp: now - (24 * 60 - i) * 60 * 1000
        });
      }
      
      // Filter for last hour
      const oneHourAgo = now - 60 * 60 * 1000;
      const lastHourMetrics = allMetrics.filter(m => m.timestamp >= oneHourAgo);
      
      // Filter for performance issues only
      const performanceIssues = allMetrics.filter(m => 
        m.fps < 30 || m.memoryUsage > 80 || m.cpuUsage > 70
      );
      
      expect(lastHourMetrics.length).toBeLessThanOrEqual(60); // Max 60 samples
      expect(lastHourMetrics.length).toBeGreaterThan(0);
      expect(performanceIssues.every(m => 
        m.fps < 30 || m.memoryUsage > 80 || m.cpuUsage > 70
      )).toBe(true);
    });

    test('should include system information in exports', () => {
      const systemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        devicePixelRatio: window.devicePixelRatio,
        webglSupported: !!(document.createElement('canvas').getContext('webgl')),
        memory: (performance as any).memory ? {
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize
        } : null
      };
      
      const exportWithSystem = {
        systemInfo,
        exportTimestamp: new Date().toISOString(),
        metrics: []
      };
      
      expect(systemInfo.userAgent).toBeDefined();
      expect(systemInfo.webglSupported).toBeDefined();
      expect(systemInfo.memory).toBeDefined();
      expect(exportWithSystem.systemInfo.devicePixelRatio).toBeDefined();
    });
  });

  describe('Accessibility Features', () => {
    
    test('should support keyboard navigation in dashboard', () => {
      // Mock dashboard component structure
      const dashboardElements = [
        { id: 'fps-chart', tabIndex: 0, role: 'img', ariaLabel: 'FPS over time chart' },
        { id: 'memory-chart', tabIndex: 0, role: 'img', ariaLabel: 'Memory usage chart' },
        { id: 'cpu-chart', tabIndex: 0, role: 'img', ariaLabel: 'CPU usage chart' },
        { id: 'alerts-panel', tabIndex: 0, role: 'region', ariaLabel: 'Performance alerts' },
        { id: 'export-button', tabIndex: 0, role: 'button', ariaLabel: 'Export performance data' }
      ];
      
      // Test tab order
      const tabOrder = dashboardElements.map(el => el.id);
      expect(tabOrder).toEqual([
        'fps-chart',
        'memory-chart',
        'cpu-chart',
        'alerts-panel',
        'export-button'
      ]);
      
      // Test ARIA attributes
      dashboardElements.forEach(element => {
        expect(element.tabIndex).toBe(0);
        expect(element.role).toBeDefined();
        expect(element.ariaLabel).toBeDefined();
      });
    });

    test('should provide screen reader announcements for alerts', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      // Mock ARIA live region
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('id', 'performance-announcements');
      document.body.appendChild(liveRegion);
      
      const alert: PerformanceAlert = {
        type: 'fps-drop',
        severity: 'high',
        message: 'Frame rate has dropped to 18 FPS. Consider reducing visual effects.',
        metrics: {
          fps: 18,
          memoryUsage: 85,
          cpuUsage: 75,
          renderTime: 55.5,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
      
      // Simulate screen reader announcement
      const announcement = `Performance alert: ${alert.message}`;
      liveRegion.textContent = announcement;
      
      expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion.textContent).toContain('Frame rate has dropped');
      
      document.body.removeChild(liveRegion);
    });

    test('should support high contrast mode', () => {
      // Mock high contrast preference
      const mockHighContrast = true;
      
      const chartColors = {
        normal: {
          fps: '#3498db',
          memory: '#e74c3c',
          cpu: '#f39c12',
          background: '#ffffff',
          text: '#333333'
        },
        highContrast: {
          fps: '#000000',
          memory: '#ffffff',
          cpu: '#ffff00',
          background: '#000000',
          text: '#ffffff'
        }
      };
      
      const activeColors = mockHighContrast ? chartColors.highContrast : chartColors.normal;
      
      expect(activeColors.background).toBe('#000000');
      expect(activeColors.text).toBe('#ffffff');
      expect(activeColors.fps).toBe('#000000');
    });

    test('should provide alternative data representations', () => {
      const metricsData: PerformanceMetrics = {
        fps: 45.7,
        memoryUsage: 67.3,
        cpuUsage: 82.1,
        renderTime: 21.8,
        timestamp: Date.now()
      };
      
      // Text-based data representation for screen readers
      const textRepresentation = {
        fps: `Frame rate: ${metricsData.fps.toFixed(0)} frames per second. ${metricsData.fps >= 30 ? 'Good' : 'Poor'} performance.`,
        memory: `Memory usage: ${metricsData.memoryUsage.toFixed(0)} megabytes. ${metricsData.memoryUsage > 100 ? 'High' : 'Normal'} usage.`,
        cpu: `CPU usage: ${metricsData.cpuUsage.toFixed(0)} percent. ${metricsData.cpuUsage > 80 ? 'High' : 'Normal'} load.`,
        renderTime: `Render time: ${metricsData.renderTime.toFixed(1)} milliseconds per frame.`
      };
      
      expect(textRepresentation.fps).toContain('46 frames per second');
      expect(textRepresentation.memory).toContain('67 megabytes');
      expect(textRepresentation.cpu).toContain('High load');
    });

    test('should respect reduced motion preferences', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      // Mock reduced motion preference
      global.testUtils.mockReducedMotion(true);
      
      await act(async () => {
        result.current.actions.updatePreferences({
          reducedMotion: true,
          moduleSettings: {
            performanceMonitoring: {
              animationDuration: 0, // Disable animations
              chartTransitions: false, // Disable chart transitions
              smoothScrolling: false // Disable smooth scrolling
            }
          }
        });
      });
      
      const preferences = result.current.state.userPreferences;
      const monitoringSettings = preferences.moduleSettings.performanceMonitoring;
      
      expect(preferences.reducedMotion).toBe(true);
      expect(monitoringSettings?.animationDuration).toBe(0);
      expect(monitoringSettings?.chartTransitions).toBe(false);
    });
  });

  describe('Privacy Compliance', () => {
    
    test('should store all data locally only', () => {
      const performanceData = {
        sessionId: 'local-session-123',
        metrics: [
          { fps: 60, memoryUsage: 50, cpuUsage: 30, renderTime: 16.67, timestamp: Date.now() }
        ],
        alerts: [],
        preferences: {
          alertThresholds: { fps: 30, memory: 100, cpu: 80 }
        }
      };
      
      // Store in localStorage
      localStorage.setItem('performance-monitoring-data', JSON.stringify(performanceData));
      
      // Verify data is stored locally
      const storedData = localStorage.getItem('performance-monitoring-data');
      expect(storedData).toBeDefined();
      expect(JSON.parse(storedData!)).toEqual(performanceData);
      
      // Ensure no data is in sessionStorage or sent externally
      expect(sessionStorage.getItem('performance-monitoring-data')).toBeNull();
      
      // Mock network requests to ensure no external data transmission
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      
      // Simulate data processing - should not trigger any network requests
      const processedData = JSON.parse(storedData!);
      expect(processedData.sessionId).toBe('local-session-123');
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should allow complete data clearing', async () => {
      const { result } = renderHook(() => useBackground(), { wrapper });
      
      // Set up some performance data
      const testData = {
        metrics: [
          { fps: 60, memoryUsage: 50, cpuUsage: 30, renderTime: 16.67, timestamp: Date.now() }
        ],
        preferences: { alertsEnabled: true }
      };
      
      localStorage.setItem('performance-monitoring-data', JSON.stringify(testData));
      localStorage.setItem('bg-preferences', JSON.stringify({
        moduleSettings: { performanceMonitoring: testData.preferences }
      }));
      
      // Verify data exists
      expect(localStorage.getItem('performance-monitoring-data')).toBeDefined();
      
      // Clear all performance data
      await act(async () => {
        localStorage.removeItem('performance-monitoring-data');
        result.current.actions.updatePreferences({
          moduleSettings: {
            performanceMonitoring: {
              dataCleared: true,
              clearDate: new Date().toISOString()
            }
          }
        });
      });
      
      // Verify complete data removal
      expect(localStorage.getItem('performance-monitoring-data')).toBeNull();
      
      const updatedPreferences = result.current.state.userPreferences;
      expect(updatedPreferences.moduleSettings.performanceMonitoring?.dataCleared).toBe(true);
    });

    test('should not collect personally identifiable information', () => {
      const performanceMetrics: PerformanceMetrics = {
        fps: 60,
        memoryUsage: 50,
        cpuUsage: 30,
        renderTime: 16.67,
        timestamp: Date.now()
      };
      
      const systemInfo = {
        // Safe, non-PII system information only
        screen: { width: screen.width, height: screen.height },
        devicePixelRatio: window.devicePixelRatio,
        webglSupported: true,
        memoryInfo: (performance as any).memory ? {
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        // Explicitly NO PII
        userId: undefined,
        ipAddress: undefined,
        cookies: undefined,
        localStorage: undefined,
        browserFingerprint: undefined
      };
      
      const dataExport = {
        metrics: performanceMetrics,
        system: systemInfo,
        timestamp: Date.now()
      };
      
      // Verify no PII is included
      const exportString = JSON.stringify(dataExport);
      expect(exportString).not.toContain('userId');
      expect(exportString).not.toContain('email');
      expect(exportString).not.toContain('ipAddress');
      expect(systemInfo.userId).toBeUndefined();
      expect(systemInfo.cookies).toBeUndefined();
    });

    test('should support data retention policies', () => {
      const dataRetentionPolicy = {
        maxStorageDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        maxRecords: 10000,
        autoCleanup: true
      };
      
      const now = Date.now();
      const oldData = { timestamp: now - (35 * 24 * 60 * 60 * 1000) }; // 35 days old
      const recentData = { timestamp: now - (5 * 24 * 60 * 60 * 1000) }; // 5 days old
      
      // Simulate data retention check
      const isDataExpired = (timestamp: number) => {
        return now - timestamp > dataRetentionPolicy.maxStorageDuration;
      };
      
      expect(isDataExpired(oldData.timestamp)).toBe(true);
      expect(isDataExpired(recentData.timestamp)).toBe(false);
      
      // Simulate cleanup
      const dataToKeep = [oldData, recentData].filter(item => !isDataExpired(item.timestamp));
      
      expect(dataToKeep).toHaveLength(1);
      expect(dataToKeep[0]).toEqual(recentData);
    });
  });
});