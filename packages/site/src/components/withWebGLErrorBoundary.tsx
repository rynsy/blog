/**
 * Higher-Order Component for WebGL Error Boundary
 * Provides a convenient way to wrap components with WebGL error handling
 */

import React, { ComponentType, ErrorInfo } from 'react'
import { WebGLErrorBoundary } from './WebGLErrorBoundary'
import { debugBackground } from '../utils/debug'

interface WithWebGLErrorBoundaryOptions {
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  displayName?: string
}

export function withWebGLErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithWebGLErrorBoundaryOptions = {}
) {
  const WithWebGLErrorBoundaryComponent = (props: P) => {
    const handleError = (error: Error, errorInfo: ErrorInfo) => {
      debugBackground.canvas(`Error in ${options.displayName || WrappedComponent.displayName || WrappedComponent.name}:`, {
        error: error.message,
        componentStack: errorInfo.componentStack
      })

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, errorInfo)
      }
    }

    return (
      <WebGLErrorBoundary
        fallback={options.fallback}
        onError={handleError}
      >
        <WrappedComponent {...props} />
      </WebGLErrorBoundary>
    )
  }

  WithWebGLErrorBoundaryComponent.displayName = 
    `withWebGLErrorBoundary(${options.displayName || WrappedComponent.displayName || WrappedComponent.name})`

  return WithWebGLErrorBoundaryComponent
}

export default withWebGLErrorBoundary