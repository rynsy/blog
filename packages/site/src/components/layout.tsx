import React from "react"
import { Link } from "gatsby"
import ThemeToggle from "./ThemeToggle"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200 relative">
      {/* Skip Navigation Links */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-all duration-200"
        tabIndex={0}
      >
        Skip to main content
      </a>
      <a 
        href="#main-navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-40 focus:z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-all duration-200"
        tabIndex={0}
      >
        Skip to navigation
      </a>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-element py-section-sm font-sans">
        <header className="mb-section-sm">
          <nav 
            id="main-navigation"
            className="flex gap-element"
            role="navigation"
            aria-label="Main navigation"
          >
            <Link 
              to="/" 
              className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1"
              aria-current={typeof window !== 'undefined' && window.location.pathname === '/' ? 'page' : undefined}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1"
              aria-current={typeof window !== 'undefined' && window.location.pathname === '/about' ? 'page' : undefined}
            >
              About
            </Link>
            <Link 
              to="/portfolio" 
              className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1"
              aria-current={typeof window !== 'undefined' && window.location.pathname === '/portfolio' ? 'page' : undefined}
            >
              Portfolio
            </Link>
            <Link 
              to="/blog" 
              className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1"
              aria-current={typeof window !== 'undefined' && window.location.pathname === '/blog' ? 'page' : undefined}
            >
              Blog
            </Link>
            <Link 
              to="/reading" 
              className="text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1"
              aria-current={typeof window !== 'undefined' && window.location.pathname === '/reading' ? 'page' : undefined}
            >
              Reading
            </Link>
          </nav>
        </header>
        <main id="main-content" role="main">{children}</main>
      </div>
      
      {/* Controls */}
      <ThemeToggle />
    </div>
  )
}

export default Layout
