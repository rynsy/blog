import React, { useState, useEffect } from "react"
import { Link } from "gatsby"
import { ThemeProvider } from "../contexts/ThemeContext"
import ThemeToggle from "./ThemeToggle"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-element py-section-sm font-sans">
          <header className="mb-section-sm">
            <nav className="flex gap-element">
              <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-primary hover:text-primary/80 transition-colors">
                About
              </Link>
              <Link to="/portfolio" className="text-primary hover:text-primary/80 transition-colors">
                Portfolio
              </Link>
              <Link to="/blog" className="text-primary hover:text-primary/80 transition-colors">
                Blog
              </Link>
              <Link to="/reading" className="text-primary hover:text-primary/80 transition-colors">
                Reading
              </Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}

export default Layout
