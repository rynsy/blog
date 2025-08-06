"use client"

import React, { useState, useEffect } from "react"
import { Link } from "gatsby"
import ThemeToggle from "./ThemeToggle"
import InteractiveGraph from "./InteractiveGraph"

// Define font classes
const fontClasses = {
  header: "font-serif",
  content: "font-sans",
}

// Define link colors
const linkColors = [
  "hover:bg-pink-200 hover:text-pink-800",
  "hover:bg-purple-200 hover:text-purple-800",
  "hover:bg-blue-200 hover:text-blue-800",
  "hover:bg-green-200 hover:text-green-800",
]

// Typing animation component
const TypingAnimation: React.FC = () => {
  const phrases = [
    "Software Engineer",
    "Algorithm Enthusiast", 
    "Technology Writer",
    "Problem Solver",
    "Code Architect"
  ]
  
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const targetText = phrases[currentPhrase]
    
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false)
        setIsDeleting(true)
        return
      }
      
      if (isDeleting) {
        if (currentText.length === 0) {
          setIsDeleting(false)
          setCurrentPhrase((prev) => (prev + 1) % phrases.length)
        } else {
          setCurrentText(targetText.substring(0, currentText.length - 1))
        }
      } else {
        if (currentText === targetText) {
          setIsPaused(true)
        } else {
          setCurrentText(targetText.substring(0, currentText.length + 1))
        }
      }
    }, isPaused ? 2000 : isDeleting ? 100 : 150)

    return () => clearTimeout(timeout)
  }, [currentText, currentPhrase, isDeleting, isPaused, phrases])

  return (
    <span className="text-primary">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface LandingPageProps {
  name?: string
  imageUrl?: string
}

export function LandingPageComponent({
  name = "Ryan Lindsey",
  imageUrl = "/placeholder.svg",
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative overflow-hidden">
      
      {/* Match Layout structure exactly */}
      <div className="max-w-4xl mx-auto px-element py-section-sm font-sans relative z-10 min-h-screen flex flex-col">
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
        
        {/* Main Content - Interactive Graph */}
        <main className="flex-1 relative flex items-center justify-center">
          {/* Interactive Graph Visualization */}
          <div className="text-center">
            <div className="mb-6">
              <h2 className={`text-display-sm font-bold text-foreground mb-4 ${fontClasses.header}`}>
                Explore & Connect
              </h2>
              <p className="text-muted-foreground text-body-md mb-6 max-w-md mx-auto">
                Drag the nodes around and watch the connections come alive
              </p>
            </div>
            
            {/* Interactive Graph Component */}
            <InteractiveGraph />
            
            <p className="text-muted-foreground text-body-sm mt-4 max-w-lg mx-auto">
              This interactive graph represents the interconnected nature of technology, learning, and creativity
            </p>
          </div>
          
          {/* Name/subtitle in bottom left of the main area */}
          <div className="absolute bottom-0 left-0 flex items-center gap-4">
            <img
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
              src={imageUrl}
              alt={name}
              width={64}
              height={64}
            />
            <div>
              <h1 className={`text-heading-lg font-bold text-foreground ${fontClasses.header}`}>
                {name}
              </h1>
              <p className="text-muted-foreground text-body-md">
                Software Engineer
              </p>
            </div>
          </div>
        </main>
      </div>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  )
}
