/**
 * Simple Background Provider - Working fallback implementation
 * Basic functionality to get the background system operational
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface SimpleBackgroundState {
  activeModule: string | null;
  isLoading: boolean;
  error: string | null;
}

interface SimpleBackgroundActions {
  switchModule: (moduleId: string) => Promise<void>;
  clearError: () => void;
}

interface SimpleBackgroundContextValue {
  state: SimpleBackgroundState;
  actions: SimpleBackgroundActions;
}

// Initial state
const initialState: SimpleBackgroundState = {
  activeModule: 'gradient',
  isLoading: false,
  error: null,
};

const SimpleBackgroundContext = createContext<SimpleBackgroundContextValue | null>(null);

// Hook
export function useSimpleBackground(): SimpleBackgroundContextValue {
  const context = useContext(SimpleBackgroundContext);
  if (!context) {
    throw new Error('useSimpleBackground must be used within SimpleBackgroundProvider');
  }
  return context;
}

// Provider component
interface SimpleBackgroundProviderProps {
  children: React.ReactNode;
}

export function SimpleBackgroundProvider({ children }: SimpleBackgroundProviderProps) {
  const [state, setState] = useState<SimpleBackgroundState>(initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moduleInstanceRef = useRef<any | null>(null);

  // Module management
  const actions: SimpleBackgroundActions = {
    switchModule: useCallback(async (moduleId: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Cleanup existing module
        if (moduleInstanceRef.current) {
          moduleInstanceRef.current.destroy();
          moduleInstanceRef.current = null;
        }
        
        // Load and start new module
        if (moduleId === 'gradient' && canvasRef.current) {
          const gradientModule = await import('../gradient');
          const instance = gradientModule.setup({
            canvas: canvasRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            theme: 'light' // TODO: Get from theme context
          });
          
          moduleInstanceRef.current = instance;
          setState(prev => ({ ...prev, activeModule: moduleId, isLoading: false }));
        } else {
          setState(prev => ({ ...prev, activeModule: null, isLoading: false }));
        }
        
      } catch (error) {
        console.error('Failed to switch module:', error);
        setState(prev => ({ 
          ...prev, 
          error: `Failed to load module: ${moduleId}`,
          isLoading: false 
        }));
      }
    }, []),

    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, [])
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (moduleInstanceRef.current && canvasRef.current) {
        // Update canvas size
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Notify module of resize
        if (moduleInstanceRef.current.onResize) {
          moduleInstanceRef.current.onResize(canvas.width, canvas.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize default module
  useEffect(() => {
    if (state.activeModule === 'gradient') {
      actions.switchModule('gradient');
    }
  }, [actions, state.activeModule]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (moduleInstanceRef.current) {
        moduleInstanceRef.current.destroy();
      }
    };
  }, []);

  const contextValue: SimpleBackgroundContextValue = {
    state,
    actions
  };

  return (
    <SimpleBackgroundContext.Provider value={contextValue}>
      {children}
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        aria-hidden="true"
      />
    </SimpleBackgroundContext.Provider>
  );
}

export default SimpleBackgroundProvider;