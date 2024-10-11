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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="flex space-x-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          <Link to="/about" className="text-blue-600 hover:text-blue-800">About</Link>
          <Link to="/portfolio" className="text-blue-600 hover:text-blue-800">Portfolio</Link>
          <Link to="/blog" className="text-blue-600 hover:text-blue-800">Blog</Link>
        </nav>
      </header>
      <main className="mb-8">{children}</main>
      <footer className="text-center text-gray-600">
        © {new Date().getFullYear()}, Built with Gatsby
      </footer>
    </div>
  )
}

export default Layout