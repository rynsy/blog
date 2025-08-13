/**
 * Error Boundary for WebGL Components
 * Provides graceful error handling and recovery for WebGL-based background modules
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { debugBackground } from '../utils/debug'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  attemptCount: number
  lastErrorTime: number
}

export class WebGLErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout
  private maxRetryAttempts = 3
  private retryDelay = 2000 // 2 seconds
  private errorResetDelay = 30000 // 30 seconds

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      attemptCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    debugBackground.canvas('WebGL Error Boundary caught error:', error)
    
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debugBackground.canvas('WebGL Error Boundary error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      attemptCount: this.state.attemptCount
    })

    // Log WebGL-specific errors
    if (this.isWebGLError(error)) {
      this.handleWebGLError(error)
    }

    this.setState({
      error,
      errorInfo,
      attemptCount: this.state.attemptCount + 1
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Auto-retry logic for recoverable errors
    if (this.shouldAttemptRecovery(error)) {
      this.scheduleRecovery()
    }
  }

  private isWebGLError(error: Error): boolean {
    const webglErrorKeywords = [
      'webgl',
      'context lost',
      'context restored',
      'shader',
      'texture',
      'framebuffer',
      'buffer',
      'gl error'
    ]
    
    const errorMessage = error.message.toLowerCase()
    const errorStack = (error.stack || '').toLowerCase()
    
    return webglErrorKeywords.some(keyword => 
      errorMessage.includes(keyword) || errorStack.includes(keyword)
    )
  }

  private handleWebGLError(error: Error) {
    debugBackground.canvas('Handling WebGL-specific error:', error.message)
    
    // Check for context loss
    if (error.message.includes('context lost')) {
      debugBackground.canvas('WebGL context lost detected - scheduling recovery')
    }
    
    // Check for browser compatibility issues
    if (error.message.includes('not supported')) {
      debugBackground.canvas('WebGL not supported - disabling WebGL features')
    }
  }

  private shouldAttemptRecovery(error: Error): boolean {
    const { attemptCount, lastErrorTime } = this.state
    const now = Date.now()
    
    // Don't retry if we've exceeded max attempts
    if (attemptCount >= this.maxRetryAttempts) {
      debugBackground.canvas('Max retry attempts reached, not attempting recovery')
      return false
    }
    
    // Don't retry if errors are happening too frequently
    if (now - lastErrorTime < this.retryDelay) {
      debugBackground.canvas('Error occurred too recently, not attempting recovery')
      return false
    }
    
    // Only retry for recoverable WebGL errors
    const recoverableErrors = [
      'context lost',
      'context restored',
      'temporary',
      'network',
      'timeout'
    ]
    
    const isRecoverable = recoverableErrors.some(keyword =>
      error.message.toLowerCase().includes(keyword)
    )
    
    if (!isRecoverable) {
      debugBackground.canvas('Error is not recoverable:', error.message)
      return false
    }
    
    return true
  }

  private scheduleRecovery = () => {
    debugBackground.canvas(`Scheduling recovery attempt ${this.state.attemptCount + 1}/${this.maxRetryAttempts}`)
    
    this.retryTimeoutId = setTimeout(() => {
      debugBackground.canvas('Attempting recovery...')
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined
      })
    }, this.retryDelay * Math.pow(2, this.state.attemptCount)) // Exponential backoff
  }

  private handleManualRetry = () => {
    debugBackground.canvas('Manual retry requested')
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      attemptCount: 0,
      lastErrorTime: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div 
          className="webgl-error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            minHeight: '200px'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          
          <h3 style={{ 
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Background Animation Error
          </h3>
          
          <p style={{ 
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem',
            opacity: 0.8,
            maxWidth: '400px'
          }}>
            {this.isWebGLError(this.state.error!) 
              ? 'WebGL graphics are not available or encountered an error. This may be due to browser compatibility or hardware limitations.'
              : 'The background animation encountered an unexpected error.'
            }
          </p>
          
          {this.state.attemptCount < this.maxRetryAttempts && (
            <button
              onClick={this.handleManualRetry}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)'
              }}
            >
              Try Again
            </button>
          )}
          
          <details style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
            <summary style={{ cursor: 'pointer', opacity: 0.7 }}>
              Technical Details
            </summary>
            <pre style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              fontSize: '0.7rem',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '100px'
            }}>
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

export default WebGLErrorBoundary