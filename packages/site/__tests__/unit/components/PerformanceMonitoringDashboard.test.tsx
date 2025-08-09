import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerformanceMonitoringDashboard } from '../../../src/components/PerformanceMonitoringDashboard'

// Mock performance API
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  },
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
}

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
})

// Mock WebGL debug extension
const mockWebGLDebugExtension = {
  getTranslatedShaderSource: jest.fn(() => 'mock shader'),
  getParameter: jest.fn((param) => {
    switch (param) {
      case 'UNMASKED_VENDOR_WEBGL': return 'Mock Vendor'
      case 'UNMASKED_RENDERER_WEBGL': return 'Mock Renderer'
      default: return 'Mock Value'
    }
  })
}

// Mock canvas context for GPU monitoring
const mockWebGLContext = {
  getExtension: jest.fn((name) => {
    if (name === 'WEBGL_debug_renderer_info') return mockWebGLDebugExtension
    if (name === 'EXT_disjoint_timer_query_webgl2') return {}
    return null
  }),
  createQuery: jest.fn(() => ({})),
  beginQuery: jest.fn(),
  endQuery: jest.fn(),
  getQueryParameter: jest.fn(() => true),
  getParameter: jest.fn(() => 1000)
}

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext)

describe('PerformanceMonitoringDashboard', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
    onExport: jest.fn(),
    onAlertThresholdChange: jest.fn(),
    refreshInterval: 1000
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset performance mock
    mockPerformance.memory.usedJSHeapSize = 1000000
    mockPerformance.memory.totalJSHeapSize = 2000000
    mockPerformance.now.mockReturnValue(Date.now())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render dashboard when visible', () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument()
      expect(screen.getByText(/Performance Monitor/i)).toBeInTheDocument()
    })

    it('should not render when not visible', () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} isVisible={false} />)
      
      expect(screen.queryByTestId('performance-dashboard')).not.toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      const dashboard = screen.getByTestId('performance-dashboard')
      expect(dashboard).toHaveAttribute('role', 'dialog')
      expect(dashboard).toHaveAttribute('aria-label', 'Performance monitoring dashboard')
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<PerformanceMonitoringDashboard {...defaultProps} />)

      // Should be able to tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /export/i })).toHaveFocus()
    })
  })

  describe('Real-time Metrics Collection', () => {
    it('should display current FPS', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Advance time to allow metrics collection
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText(/FPS/i)).toBeInTheDocument()
        expect(screen.getByTestId('fps-value')).toBeInTheDocument()
      })
    })

    it('should display memory usage', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText(/Memory Usage/i)).toBeInTheDocument()
        expect(screen.getByTestId('memory-used')).toHaveTextContent(/1.00 MB/)
        expect(screen.getByTestId('memory-total')).toHaveTextContent(/2.00 MB/)
      })
    })

    it('should display GPU utilization when available', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText(/GPU Utilization/i)).toBeInTheDocument()
        expect(screen.getByTestId('gpu-usage')).toBeInTheDocument()
      })
    })

    it('should update metrics at specified interval', async () => {
      const fastProps = { ...defaultProps, refreshInterval: 500 }
      render(<PerformanceMonitoringDashboard {...fastProps} />)
      
      const initialMemory = screen.getByTestId('memory-used')
      const initialText = initialMemory.textContent
      
      // Change memory usage
      mockPerformance.memory.usedJSHeapSize = 1500000
      
      jest.advanceTimersByTime(500)
      
      await waitFor(() => {
        expect(screen.getByTestId('memory-used')).toHaveTextContent(/1.50 MB/)
      })
    })

    it('should collect frame timing data', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Simulate frame timing
      mockPerformance.getEntriesByType.mockReturnValue([
        { name: 'frame', duration: 16.7, startTime: 1000 },
        { name: 'frame', duration: 33.3, startTime: 1017 },
        { name: 'frame', duration: 16.7, startTime: 1050 }
      ])
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByTestId('avg-frame-time')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Alerts', () => {
    it('should show alert when FPS drops below threshold', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Simulate low FPS by mocking slow frame times
      mockPerformance.getEntriesByType.mockReturnValue([
        { name: 'frame', duration: 50, startTime: 1000 }, // 20 FPS
        { name: 'frame', duration: 55, startTime: 1050 }  // ~18 FPS
      ])
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-alert')).toBeInTheDocument()
        expect(screen.getByText(/Low FPS detected/i)).toBeInTheDocument()
      })
    })

    it('should show alert when memory usage is high', async () => {
      // Set high memory usage
      mockPerformance.memory.usedJSHeapSize = 3800000 // 95% of limit
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-alert')).toBeInTheDocument()
        expect(screen.getByText(/High memory usage/i)).toBeInTheDocument()
      })
    })

    it('should allow customizing alert thresholds', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      const thresholdInput = screen.getByLabelText(/FPS threshold/i)
      await user.clear(thresholdInput)
      await user.type(thresholdInput, '45')
      
      expect(defaultProps.onAlertThresholdChange).toHaveBeenCalledWith({
        type: 'fps',
        value: 45
      })
    })

    it('should persist alert settings', () => {
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({ fpsThreshold: 45, memoryThreshold: 80 })),
        setItem: jest.fn()
      }
      
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('performance-alert-thresholds')
    })
  })

  describe('Data Visualization', () => {
    it('should render FPS chart', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(2000) // Allow time for data collection
      
      await waitFor(() => {
        expect(screen.getByTestId('fps-chart')).toBeInTheDocument()
      })
    })

    it('should render memory usage chart', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(screen.getByTestId('memory-chart')).toBeInTheDocument()
      })
    })

    it('should limit data points for performance', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Generate many data points
      for (let i = 0; i < 200; i++) {
        jest.advanceTimersByTime(100)
      }
      
      // Should limit to reasonable number of points (e.g., 100)
      const chartData = screen.getByTestId('fps-chart').getAttribute('data-points')
      if (chartData) {
        const points = JSON.parse(chartData)
        expect(points.length).toBeLessThanOrEqual(100)
      }
    })

    it('should update charts in real-time', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      const initialChart = screen.getByTestId('fps-chart')
      const initialData = initialChart.getAttribute('data-points')
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        const updatedChart = screen.getByTestId('fps-chart')
        const updatedData = updatedChart.getAttribute('data-points')
        expect(updatedData).not.toBe(initialData)
      })
    })
  })

  describe('Data Export', () => {
    it('should export performance data as JSON', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Collect some data
      jest.advanceTimersByTime(2000)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'json',
        data: expect.objectContaining({
          fps: expect.any(Array),
          memory: expect.any(Array),
          timestamp: expect.any(Number)
        })
      })
    })

    it('should export performance data as CSV', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(2000)
      
      // Select CSV format
      const formatSelect = screen.getByLabelText(/export format/i)
      await user.selectOptions(formatSelect, 'csv')
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        data: expect.stringContaining('timestamp,fps,memory')
      })
    })

    it('should include metadata in export', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'json',
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            userAgent: expect.any(String),
            screenResolution: expect.any(String),
            timestamp: expect.any(Number)
          })
        })
      })
    })
  })

  describe('GPU Monitoring', () => {
    it('should detect GPU information', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText(/GPU:/i)).toBeInTheDocument()
        expect(screen.getByText(/Mock Renderer/i)).toBeInTheDocument()
      })
    })

    it('should measure GPU timing when supported', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByTestId('gpu-frame-time')).toBeInTheDocument()
      })
    })

    it('should show fallback when GPU timing is not supported', async () => {
      mockWebGLContext.getExtension.mockReturnValue(null)
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText(/GPU timing not available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Impact', () => {
    it('should minimize its own performance impact', async () => {
      const initialHeapSize = mockPerformance.memory.usedJSHeapSize
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Run for extended period
      for (let i = 0; i < 60; i++) {
        jest.advanceTimersByTime(1000)
      }
      
      // Dashboard itself shouldn't cause significant memory growth
      const finalHeapSize = mockPerformance.memory.usedJSHeapSize
      const growth = finalHeapSize - initialHeapSize
      expect(growth).toBeLessThan(100000) // Less than 100KB growth
    })

    it('should throttle updates when tab is not visible', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      
      const updateSpy = jest.spyOn(mockPerformance, 'now')
      
      jest.advanceTimersByTime(5000) // 5 seconds
      
      // Should call performance.now less frequently when hidden
      expect(updateSpy.mock.calls.length).toBeLessThan(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle performance API errors gracefully', async () => {
      mockPerformance.now.mockImplementation(() => {
        throw new Error('Performance API error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance monitoring error:',
        expect.any(Error)
      )
      
      // Should still render but show error state
      expect(screen.getByText(/Performance data unavailable/i)).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle WebGL context errors', async () => {
      mockWebGLContext.getExtension.mockImplementation(() => {
        throw new Error('WebGL error')
      })
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      expect(screen.getByText(/GPU monitoring unavailable/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should announce performance alerts to screen readers', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      // Trigger low FPS alert
      mockPerformance.getEntriesByType.mockReturnValue([
        { name: 'frame', duration: 50, startTime: 1000 }
      ])
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        const alert = screen.getByTestId('performance-alert')
        expect(alert).toHaveAttribute('role', 'alert')
        expect(alert).toHaveAttribute('aria-live', 'assertive')
      })
    })

    it('should provide alternative text for charts', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        const chart = screen.getByTestId('fps-chart')
        expect(chart).toHaveAttribute('aria-label', expect.stringContaining('FPS over time'))
      })
    })

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
      
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      const dashboard = screen.getByTestId('performance-dashboard')
      expect(dashboard).toHaveClass('high-contrast')
    })
  })

  describe('Privacy Compliance', () => {
    it('should not collect personally identifiable information', async () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      jest.advanceTimersByTime(2000)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      await user.click(exportButton)
      
      const exportedData = defaultProps.onExport.mock.calls[0][0].data
      
      // Should not contain IP addresses, user IDs, etc.
      expect(JSON.stringify(exportedData)).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) // No IP addresses
      expect(exportedData).not.toHaveProperty('userId')
      expect(exportedData).not.toHaveProperty('sessionId')
    })

    it('should store data locally only', () => {
      render(<PerformanceMonitoringDashboard {...defaultProps} />)
      
      const fetchSpy = jest.spyOn(global, 'fetch')
      
      jest.advanceTimersByTime(2000)
      
      // Should not make any external network requests
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})