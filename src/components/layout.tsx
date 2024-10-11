import React from "react"
import { Link } from "gatsby"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div>
    <header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/blog">Blog</Link>
      </nav>
    </header>
    <main>{children}</main>
    <footer>
      © {new Date().getFullYear()}, Built with Gatsby
    </footer>
  </div>
)

export default Layout