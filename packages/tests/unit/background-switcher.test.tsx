import { render } from '@testing-library/react'
import { vi } from 'vitest'
import BackgroundSwitcher from '@site/components/BackgroundSwitcher'
import { BackgroundProvider } from '@site/contexts/BackgroundContext'
import { ThemeProvider } from '@site/contexts/ThemeContext'

// Mock background modules
vi.mock('@site/bgModules/registry', () => ({
  moduleRegistry: {
    gradient: {
      name: 'Animated Gradient',
      description: 'A smooth animated gradient background',
      icon: '🌈',
      load: vi.fn(() => Promise.resolve({
        setup: vi.fn(() => ({
          pause: vi.fn(),
          resume: vi.fn(),
          destroy: vi.fn()
        }))
      }))
    },
    knowledge: {
      name: 'Knowledge Graph',
      description: 'Interactive network of ideas',
      icon: '🕸️',
      load: vi.fn(() => Promise.resolve({
        setup: vi.fn(() => ({
          pause: vi.fn(),
          resume: vi.fn(),
          destroy: vi.fn()
        }))
      }))
    }
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <BackgroundProvider>
      {children}
    </BackgroundProvider>
  </ThemeProvider>
)

describe('BackgroundSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <BackgroundSwitcher module="gradient" />
      </TestWrapper>
    )
  })

  it('calls setCurrentModule with provided module prop', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    render(
      <TestWrapper>
        <BackgroundSwitcher module="gradient" />
      </TestWrapper>
    )

    expect(consoleSpy).toHaveBeenCalledWith('🌟 BackgroundSwitcher: Switching to gradient background')
    
    consoleSpy.mockRestore()
  })

  it('switches modules when prop changes', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const { rerender } = render(
      <TestWrapper>
        <BackgroundSwitcher module="gradient" />
      </TestWrapper>
    )

    expect(consoleSpy).toHaveBeenCalledWith('🌟 BackgroundSwitcher: Switching to gradient background')

    rerender(
      <TestWrapper>
        <BackgroundSwitcher module="knowledge" />
      </TestWrapper>
    )

    expect(consoleSpy).toHaveBeenCalledWith('🌟 BackgroundSwitcher: Switching to knowledge background')
    
    consoleSpy.mockRestore()
  })

  it('handles invalid module names gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    render(
      <TestWrapper>
        <BackgroundSwitcher module="nonexistent" />
      </TestWrapper>
    )

    expect(consoleSpy).toHaveBeenCalledWith('🌟 BackgroundSwitcher: Switching to nonexistent background')
    
    consoleSpy.mockRestore()
  })

  it('does not render any DOM elements', () => {
    const { container } = render(
      <TestWrapper>
        <BackgroundSwitcher module="gradient" />
      </TestWrapper>
    )

    expect(container.firstChild).toBeNull()
  })
})