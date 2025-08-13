/**
 * Keyboard Navigation Utility
 * Provides comprehensive keyboard navigation support for interactive elements
 */

export interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean
  enableTabNavigation?: boolean
  enableSpaceEnter?: boolean
  enableEscape?: boolean
  wrapNavigation?: boolean
  customKeys?: Record<string, () => void>
}

export interface FocusableElement {
  id: string
  element: HTMLElement | SVGElement
  onActivate?: () => void
  onFocus?: () => void
  onBlur?: () => void
  ariaLabel?: string
  ariaDescription?: string
}

export class KeyboardNavigationManager {
  private elements: Map<string, FocusableElement> = new Map()
  private currentFocusIndex: number = -1
  private isActive: boolean = false
  private options: KeyboardNavigationOptions
  private keydownHandler: (event: KeyboardEvent) => void

  constructor(options: KeyboardNavigationOptions = {}) {
    this.options = {
      enableArrowKeys: true,
      enableTabNavigation: true,
      enableSpaceEnter: true,
      enableEscape: true,
      wrapNavigation: true,
      ...options
    }

    this.keydownHandler = this.handleKeyDown.bind(this)
  }

  /**
   * Register a focusable element
   */
  registerElement(focusableElement: FocusableElement): void {
    // Add ARIA attributes
    const { element, ariaLabel, ariaDescription } = focusableElement
    
    if (ariaLabel) {
      element.setAttribute('aria-label', ariaLabel)
    }
    
    if (ariaDescription) {
      element.setAttribute('aria-describedby', `${focusableElement.id}-desc`)
      
      // Create description element if it doesn't exist
      let descElement = document.getElementById(`${focusableElement.id}-desc`)
      if (!descElement) {
        descElement = document.createElement('div')
        descElement.id = `${focusableElement.id}-desc`
        descElement.className = 'sr-only'
        descElement.textContent = ariaDescription
        document.body.appendChild(descElement)
      }
    }

    // Make element focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0')
    }

    // Add role if not present
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'button')
    }

    // Add focus/blur event listeners
    element.addEventListener('focus', () => {
      this.currentFocusIndex = Array.from(this.elements.keys()).indexOf(focusableElement.id)
      focusableElement.onFocus?.()
      this.announceElement(focusableElement)
    })

    element.addEventListener('blur', () => {
      focusableElement.onBlur?.()
    })

    // Add click/activation support
    element.addEventListener('click', () => {
      focusableElement.onActivate?.()
    })

    this.elements.set(focusableElement.id, focusableElement)
  }

  /**
   * Unregister an element
   */
  unregisterElement(id: string): void {
    const element = this.elements.get(id)
    if (element) {
      // Clean up ARIA description element
      const descElement = document.getElementById(`${id}-desc`)
      if (descElement) {
        descElement.remove()
      }
    }
    
    this.elements.delete(id)
    
    // Update current focus index if necessary
    if (this.currentFocusIndex >= this.elements.size) {
      this.currentFocusIndex = Math.max(0, this.elements.size - 1)
    }
  }

  /**
   * Activate keyboard navigation
   */
  activate(): void {
    if (this.isActive) return
    
    this.isActive = true
    document.addEventListener('keydown', this.keydownHandler)
    
    // Focus first element if none is focused
    if (this.currentFocusIndex === -1 && this.elements.size > 0) {
      this.focusElement(0)
    }
  }

  /**
   * Deactivate keyboard navigation
   */
  deactivate(): void {
    if (!this.isActive) return
    
    this.isActive = false
    document.removeEventListener('keydown', this.keydownHandler)
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Skip if typing in input field
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return
    }

    const elementIds = Array.from(this.elements.keys())
    
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        if (this.options.enableArrowKeys) {
          event.preventDefault()
          this.focusPrevious()
        }
        break

      case 'ArrowDown':
      case 'ArrowRight':
        if (this.options.enableArrowKeys) {
          event.preventDefault()
          this.focusNext()
        }
        break

      case 'Home':
        if (this.options.enableArrowKeys) {
          event.preventDefault()
          this.focusElement(0)
        }
        break

      case 'End':
        if (this.options.enableArrowKeys) {
          event.preventDefault()
          this.focusElement(elementIds.length - 1)
        }
        break

      case ' ':
      case 'Enter':
        if (this.options.enableSpaceEnter && this.currentFocusIndex >= 0) {
          event.preventDefault()
          const currentId = elementIds[this.currentFocusIndex]
          const currentElement = this.elements.get(currentId)
          currentElement?.onActivate?.()
        }
        break

      case 'Escape':
        if (this.options.enableEscape) {
          event.preventDefault()
          this.blur()
        }
        break

      case 'Tab':
        if (this.options.enableTabNavigation) {
          // Let default tab behavior work, but update our tracking
          setTimeout(() => {
            const focused = document.activeElement
            if (focused) {
              const focusedId = Array.from(this.elements.values())
                .find(el => el.element === focused)?.id
              if (focusedId) {
                this.currentFocusIndex = elementIds.indexOf(focusedId)
              }
            }
          }, 0)
        }
        break

      default:
        // Handle custom keys
        if (this.options.customKeys?.[event.key]) {
          event.preventDefault()
          this.options.customKeys[event.key]()
        }
        break
    }
  }

  /**
   * Focus next element
   */
  private focusNext(): void {
    const elementIds = Array.from(this.elements.keys())
    if (elementIds.length === 0) return

    const nextIndex = this.options.wrapNavigation
      ? (this.currentFocusIndex + 1) % elementIds.length
      : Math.min(this.currentFocusIndex + 1, elementIds.length - 1)
    
    this.focusElement(nextIndex)
  }

  /**
   * Focus previous element
   */
  private focusPrevious(): void {
    const elementIds = Array.from(this.elements.keys())
    if (elementIds.length === 0) return

    const prevIndex = this.options.wrapNavigation
      ? this.currentFocusIndex <= 0 
        ? elementIds.length - 1 
        : this.currentFocusIndex - 1
      : Math.max(this.currentFocusIndex - 1, 0)
    
    this.focusElement(prevIndex)
  }

  /**
   * Focus element by index
   */
  private focusElement(index: number): void {
    const elementIds = Array.from(this.elements.keys())
    if (index < 0 || index >= elementIds.length) return

    const elementId = elementIds[index]
    const focusableElement = this.elements.get(elementId)
    
    if (focusableElement) {
      this.currentFocusIndex = index
      focusableElement.element.focus()
    }
  }

  /**
   * Remove focus from all elements
   */
  private blur(): void {
    const focused = document.activeElement
    if (focused instanceof HTMLElement) {
      focused.blur()
    }
    this.currentFocusIndex = -1
  }

  /**
   * Announce element to screen readers
   */
  private announceElement(focusableElement: FocusableElement): void {
    // Create or update live region for announcements
    let liveRegion = document.getElementById('keyboard-nav-announcements')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'keyboard-nav-announcements'
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    const announcement = focusableElement.ariaLabel || focusableElement.id
    liveRegion.textContent = `Focused: ${announcement}`
  }

  /**
   * Get current focused element
   */
  getCurrentElement(): FocusableElement | undefined {
    const elementIds = Array.from(this.elements.keys())
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < elementIds.length) {
      return this.elements.get(elementIds[this.currentFocusIndex])
    }
    return undefined
  }

  /**
   * Get all registered elements
   */
  getAllElements(): FocusableElement[] {
    return Array.from(this.elements.values())
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.deactivate()
    
    // Clean up ARIA description elements
    this.elements.forEach((element, id) => {
      const descElement = document.getElementById(`${id}-desc`)
      if (descElement) {
        descElement.remove()
      }
    })
    
    // Clean up announcements
    const liveRegion = document.getElementById('keyboard-nav-announcements')
    if (liveRegion) {
      liveRegion.remove()
    }
    
    this.elements.clear()
    this.currentFocusIndex = -1
  }
}

// React hook removed to avoid import issues - use KeyboardNavigationManager directly

/**
 * Keyboard navigation shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  NAVIGATION: {
    'ArrowUp/ArrowLeft': 'Navigate to previous element',
    'ArrowDown/ArrowRight': 'Navigate to next element',
    'Home': 'Navigate to first element',
    'End': 'Navigate to last element',
    'Tab/Shift+Tab': 'Standard tab navigation',
    'Space/Enter': 'Activate focused element',
    'Escape': 'Clear focus'
  },
  GLOBAL: {
    'Ctrl+Shift+B': 'Open background controls',
    'Shift+~': 'Cycle through background modules',
    'Escape': 'Close dialogs/modals'
  }
}

// Note: React import should be handled by the consuming component