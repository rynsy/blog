import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BackgroundProvider, useBackground } from '@site/contexts/BackgroundContext'

// Mock background modules
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
    }),
    knowledge: () => Promise.resolve({
      meta: {
        id: 'knowledge',
        name: 'Knowledge Graph',
        layer: 'background',
        interactive: true,
        themeAware: false
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

const TestComponent = () => {
  const { activeModuleId, setActiveModule, availableModules } = useBackground()
  
  return (
    <div>
      <div data-testid="active-module">{activeModuleId}</div>
      <div data-testid="modules-count">{availableModules.length}</div>
      {availableModules.map(module => (
        <button
          key={module.id}
          data-testid={`select-${module.id}`}
          onClick={() => setActiveModule(module.id)}
        >
          {module.name}
        </button>
      ))}
    </div>
  )
}

describe('BackgroundContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads available modules on mount', async () => {
    render(
      <BackgroundProvider>
        <TestComponent />
      </BackgroundProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2')
    })

    expect(screen.getByText('Gradient')).toBeInTheDocument()
    expect(screen.getByText('Knowledge Graph')).toBeInTheDocument()
  })

  it('persists active module to localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <BackgroundProvider>
        <TestComponent />
      </BackgroundProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('modules-count')).toHaveTextContent('2')
    })

    await user.click(screen.getByTestId('select-knowledge'))

    await waitFor(() => {
      expect(screen.getByTestId('active-module')).toHaveTextContent('knowledge')
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('activeModuleId', 'knowledge')
  })

  it('restores active module from localStorage', () => {
    localStorage.setItem('activeModuleId', 'gradient')
    
    render(
      <BackgroundProvider>
        <TestComponent />
      </BackgroundProvider>
    )

    expect(screen.getByTestId('active-module')).toHaveTextContent('gradient')
  })

  it('handles invalid module IDs gracefully', () => {
    localStorage.setItem('activeModuleId', 'nonexistent')
    
    render(
      <BackgroundProvider>
        <TestComponent />
      </BackgroundProvider>
    )

    // Should fallback to no active module or first available
    expect(screen.getByTestId('active-module')).not.toHaveTextContent('nonexistent')
  })
})