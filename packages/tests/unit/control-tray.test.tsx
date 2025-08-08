import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlTray from '@site/components/ControlTray'
import { BackgroundProvider } from '@site/contexts/BackgroundContext'
import { ThemeProvider } from '@site/contexts/ThemeContext'
import React from 'react'

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  Cog6ToothIcon: ({ className }: { className?: string }) => <div data-testid="cog-icon" className={className} />,
  XMarkIcon: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  PlayIcon: ({ className }: { className?: string }) => <div data-testid="play-icon" className={className} />,
  PauseIcon: ({ className }: { className?: string }) => <div data-testid="pause-icon" className={className} />,
  EyeIcon: ({ className }: { className?: string }) => <div data-testid="eye-icon" className={className} />,
  EyeSlashIcon: ({ className }: { className?: string }) => <div data-testid="eye-slash-icon" className={className} />,
  ChevronDownIcon: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  CheckIcon: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />
}))

// Mock Headless UI components
vi.mock('@headlessui/react', () => ({
  Dialog: ({ children, onClose, ...props }: any) => (
    <div data-testid="dialog" {...props}>
      {children}
      <button data-testid="dialog-close" onClick={() => onClose(false)} />
    </div>
  ),
  'Dialog.Panel': ({ children, className }: any) => (
    <div data-testid="dialog-panel" className={className}>
      {children}
    </div>
  ),
  'Dialog.Title': ({ children, className }: any) => (
    <h3 data-testid="dialog-title" className={className}>
      {children}
    </h3>
  ),
  Transition: ({ children, show }: any) => show ? <div data-testid="transition">{children}</div> : null,
  'Transition.Child': ({ children }: any) => <div data-testid="transition-child">{children}</div>,
  Switch: ({ checked, onChange, disabled, className, children }: any) => (
    <button
      data-testid="switch"
      className={className}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
    >
      <span data-checked={checked}>{children}</span>
    </button>
  ),
  Listbox: ({ children, value, onChange }: any) => (
    <div data-testid="listbox" onClick={() => onChange && onChange(value)}>
      {children}
    </div>
  ),
  'Listbox.Button': ({ children, className }: any) => (
    <button data-testid="listbox-button" className={className}>
      {children}
    </button>
  ),
  'Listbox.Options': ({ children, className }: any) => (
    <div data-testid="listbox-options" className={className}>
      {children}
    </div>
  ),
  'Listbox.Option': ({ children, value, className }: any) => (
    <div data-testid="listbox-option" className={className} data-value={value?.id || value}>
      {typeof children === 'function' 
        ? children({ selected: false, active: false }) 
        : children}
    </div>
  )
}))

// Mock ThemeContext
vi.mock('@site/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}))

// Mock debug utility
vi.mock('@site/utils/debug', () => ({
  debugBackground: {
    controls: vi.fn()
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <BackgroundProvider>
      {children}
    </BackgroundProvider>
  </ThemeProvider>
)

describe('ControlTray Component (C-01)', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders control button in closed state', () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Should have the main control button
      expect(screen.getByRole('button', { name: /open background controls/i })).toBeInTheDocument()
      expect(screen.getByTestId('cog-icon')).toBeInTheDocument()
      
      // Dialog should not be visible
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })

    it('opens dialog when control button is clicked', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1] // Main visible button
      await user.click(controlButton)

      // Dialog should now be visible
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Background Controls')
    })

    it('renders secret trigger area', () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      const secretButton = screen.getAllByRole('button', { name: /open background controls/i })[0]
      expect(secretButton).toHaveClass('opacity-0')
      expect(secretButton).toHaveAttribute('title', expect.stringContaining('Shift + ~'))
    })
  })

  describe('Module Selection (C-01)', () => {
    it('displays current module selection', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Should show "None" as default since no modules are registered
      expect(screen.getByText('None')).toBeInTheDocument()
      expect(screen.getByText('No background animation')).toBeInTheDocument()
    })

    it('shows registered modules in dropdown', async () => {
      // Create a test component that registers a module
      const TestWithModule = () => {
        const [isRegistered, setIsRegistered] = React.useState(false)
        
        return (
          <TestWrapper>
            <button 
              data-testid="register-module" 
              onClick={() => setIsRegistered(true)}
            >
              Register
            </button>
            {isRegistered && <ModuleRegistrator />}
            <ControlTray />
          </TestWrapper>
        )
      }

      const ModuleRegistrator = () => {
        const { registerModule } = require('@site/contexts/BackgroundContext').useBackground()
        
        React.useEffect(() => {
          registerModule('test-module', {
            name: 'Test Module',
            description: 'A test background module',
            icon: '🧪',
            load: () => Promise.resolve({
              setup: () => ({
                pause: vi.fn(),
                resume: vi.fn(),
                destroy: vi.fn()
              })
            })
          })
        }, [registerModule])

        return null
      }

      render(<TestWithModule />)

      // Register the module
      await user.click(screen.getByTestId('register-module'))

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Should show the registered module in options
      expect(screen.getByText('Test Module')).toBeInTheDocument()
      expect(screen.getByText('A test background module')).toBeInTheDocument()
      expect(screen.getByText('🧪')).toBeInTheDocument()
    })

    it('calls setCurrentModule and destroys previous module when switching', async () => {
      const mockModuleInstance = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn()
      }

      const TestWithModuleSwitching = () => {
        const backgroundContext = require('@site/contexts/BackgroundContext').useBackground() as any
        
        React.useEffect(() => {
          // Register test modules
          backgroundContext.registerModule('module1', {
            name: 'Module 1',
            description: 'First test module',
            load: () => Promise.resolve({
              setup: () => mockModuleInstance
            })
          })
          
          backgroundContext.registerModule('module2', {
            name: 'Module 2', 
            description: 'Second test module',
            load: () => Promise.resolve({
              setup: () => mockModuleInstance
            })
          })

          // Set initial module instance
          backgroundContext._setModuleInstance(mockModuleInstance)
        }, [])

        return <ControlTray />
      }

      render(
        <TestWrapper>
          <TestWithModuleSwitching />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Find and click on module option to switch
      const moduleOptions = screen.getAllByTestId('listbox-option')
      const module1Option = moduleOptions.find(option => 
        option.textContent?.includes('Module 1')
      )

      if (module1Option) {
        await user.click(module1Option)
        
        await waitFor(() => {
          // Previous module instance should be destroyed when switching
          expect(mockModuleInstance.destroy).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Control Switches', () => {
    it('toggles background active state', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Find active toggle switch
      const switches = screen.getAllByTestId('switch')
      const activeSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Background Active')
      )

      expect(activeSwitch).toBeInTheDocument()
      
      // Initially should be inactive (false)
      expect(activeSwitch).toHaveAttribute('aria-checked', 'false')

      // Click to activate
      await user.click(activeSwitch!)
      
      await waitFor(() => {
        expect(activeSwitch).toHaveAttribute('aria-checked', 'true')
      })
    })

    it('toggles pause state', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // First activate background
      const switches = screen.getAllByTestId('switch')
      const activeSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Background Active')
      )
      await user.click(activeSwitch!)

      // Then find pause toggle
      const pauseSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Animation Paused')
      )

      expect(pauseSwitch).toBeInTheDocument()
      expect(pauseSwitch).not.toBeDisabled()

      // Click to pause
      await user.click(pauseSwitch!)
      
      await waitFor(() => {
        expect(pauseSwitch).toHaveAttribute('aria-checked', 'true')
      })
    })

    it('disables pause switch when background is inactive', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      const switches = screen.getAllByTestId('switch')
      const pauseSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Animation Paused')
      )

      // Should be disabled when background is inactive
      expect(pauseSwitch).toBeDisabled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('cycles through modules with Shift + ~', async () => {
      const TestWithMultipleModules = () => {
        const backgroundContext = require('@site/contexts/BackgroundContext').useBackground() as any
        
        React.useEffect(() => {
          backgroundContext.registerModule('module1', {
            name: 'Module 1',
            description: 'First module',
            load: () => Promise.resolve({ setup: () => ({}) })
          })
          
          backgroundContext.registerModule('module2', {
            name: 'Module 2', 
            description: 'Second module',
            load: () => Promise.resolve({ setup: () => ({}) })
          })
        }, [])

        return <ControlTray />
      }

      render(
        <TestWrapper>
          <TestWithMultipleModules />
        </TestWrapper>
      )

      // Simulate Shift + ~ key combination
      await act(async () => {
        fireEvent.keyDown(window, {
          key: '~',
          shiftKey: true,
          preventDefault: vi.fn()
        })
      })

      // Open tray to verify module changed
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Should have cycled to first registered module
      await waitFor(() => {
        expect(screen.getByText('Module 1')).toBeInTheDocument()
      })
    })

    it('closes tray with Escape key', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()

      // Press Escape
      await act(async () => {
        fireEvent.keyDown(window, {
          key: 'Escape',
          preventDefault: vi.fn()
        })
      })

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Controls', () => {
    it('closes dialog when X button is clicked', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open dialog
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()

      // Find and click close button
      const closeButton = screen.getByTestId('dialog-close')
      await user.click(closeButton)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Visual States', () => {
    it('shows correct icons for active/inactive state', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Initially inactive - should show eye-slash icon
      expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument()

      // Toggle active
      const switches = screen.getAllByTestId('switch')
      const activeSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Background Active')
      )
      await user.click(activeSwitch!)

      // Should now show eye icon
      await waitFor(() => {
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
        expect(screen.queryByTestId('eye-slash-icon')).not.toBeInTheDocument()
      })
    })

    it('shows correct icons for play/pause state', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Activate background first
      const switches = screen.getAllByTestId('switch')
      const activeSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Background Active')
      )
      await user.click(activeSwitch!)

      // Initially playing - should show play icon
      expect(screen.getByTestId('play-icon')).toBeInTheDocument()
      
      // Toggle pause
      const pauseSwitch = switches.find(sw => 
        sw.closest('div')?.textContent?.includes('Animation Paused')
      )
      await user.click(pauseSwitch!)

      // Should now show pause icon
      await waitFor(() => {
        expect(screen.getByTestId('pause-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Help Text', () => {
    it('displays keyboard shortcut help', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      // Open control tray
      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      await user.click(controlButton)

      // Should show keyboard shortcut help
      expect(screen.getByText('to cycle modules')).toBeInTheDocument()
      expect(screen.getByText('Animations respect your reduced motion preferences')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      const controlButtons = screen.getAllByRole('button', { name: /open background controls/i })
      expect(controlButtons).toHaveLength(2) // Secret area + main button

      controlButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label', 'Open background controls')
      })
    })

    it('manages focus properly when opening/closing dialog', async () => {
      render(
        <TestWrapper>
          <ControlTray />
        </TestWrapper>
      )

      const controlButton = screen.getAllByRole('button', { name: /open background controls/i })[1]
      
      // Open dialog
      await user.click(controlButton)
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      
      // Close with X button
      const closeButton = screen.getByTestId('dialog-close')
      await user.click(closeButton)
      
      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })
})