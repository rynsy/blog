import React, { useState, useEffect } from "react"
import { Link } from "gatsby"

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
        </nav>
      </header>
      <main className="mb-section-sm">{children}</main>
      <footer className="text-center text-muted-foreground">
        © {new Date().getFullYear()}, Built with Gatsby
      </footer>
    </div>
  )
}

export default Layout
