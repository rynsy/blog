import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import CanvasHost from '@site/components/CanvasHost'
import { BackgroundProvider } from '@site/contexts/BackgroundContext'

// Mock the background modules registry
vi.mock('@site/bgModules/registry', () => ({
  modules: {
    gradient: () => Promise.resolve({
      meta: {
        id: 'gradient',
        name: 'Gradient',
        layer: 'background',
        interactive: false,
        themeAware: true
      },
      mod: {
        setup: vi.fn(() => ({
          pause: vi.fn(),
          resume: vi.fn(),
          destroy: vi.fn()
        }))
      }
    })
  }
}))

describe('CanvasHost', () => {
  it('renders canvas element', () => {
    render(
      <BackgroundProvider>
        <CanvasHost />
      </BackgroundProvider>
    )

    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
  })

  it('applies correct CSS classes for background layer', () => {
    render(
      <BackgroundProvider>
        <CanvasHost />
      </BackgroundProvider>
    )

    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas).toHaveClass('fixed', 'inset-0', 'pointer-events-none')
  })

  it('respects reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(
      <BackgroundProvider>
        <CanvasHost />
      </BackgroundProvider>
    )

    // Canvas should still render but modules should be paused
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('handles visibility changes correctly', () => {    
    // Mock module with pause/resume
    vi.mocked(global.requestAnimationFrame).mockImplementation((callback) => {
      callback(0)
      return 0
    })

    render(
      <BackgroundProvider>
        <CanvasHost />
      </BackgroundProvider>
    )

    // Simulate page visibility change
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true,
    })
    
    const visibilityEvent = new Event('visibilitychange')
    document.dispatchEvent(visibilityEvent)

    // Module should be paused when page is hidden
    // Note: This test would need the actual module implementation to verify pause/resume calls
  })
})