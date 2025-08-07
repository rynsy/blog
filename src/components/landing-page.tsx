"use client"

import React, { useState, useEffect } from "react"
import { Link } from "gatsby"

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

// Lazy load the background switcher to avoid SSR issues
const BackgroundSwitcher = React.lazy(() => import('./BackgroundSwitcher'))

export function LandingPageComponent({
  name = "Ryan Lindsey",
  imageUrl = "/placeholder.svg",
}: LandingPageProps) {
  const [isMounted, setIsMounted] = useState(false)
  console.log('🌟 LandingPage: Rendering LandingPageComponent')
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  return (
    <div className="relative min-h-[calc(100vh-theme(spacing.32))] flex flex-col">
      {/* Client-only background switcher */}
      {isMounted && (
        <React.Suspense fallback={null}>
          <BackgroundSwitcher module="knowledge" />
        </React.Suspense>
      )}
      
      {/* Main Content */}
      <main className="flex-1 relative flex items-center justify-center">
        {/* Hero Section with background knowledge graph */}
        <div className="text-center relative" style={{ zIndex: 10 }}>
          <div className="mb-6">
            <h1 className={`text-display-lg font-bold text-foreground mb-4 ${fontClasses.header}`}>
              {name}
            </h1>
            <div className="text-xl text-foreground/80 mb-8">
              <TypingAnimation />
            </div>
          </div>
          
          <p className="text-muted-foreground text-body-lg max-w-2xl mx-auto mb-8 backdrop-blur-sm bg-white/10 dark:bg-black/20 p-6 rounded-lg">
            Welcome to my digital space where ideas connect and evolve. 
            Interact with the knowledge graph behind this text - right-click to add nodes, 
            drag to explore, and click two nodes in sequence to create connections.
          </p>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/blog"
              className={`px-6 py-3 bg-primary text-primary-foreground rounded-lg transition-all duration-200 ${linkColors[0]} font-medium shadow-lg hover:shadow-xl hover:scale-105`}
            >
              Read Blog
            </Link>
            <Link
              to="/portfolio"
              className={`px-6 py-3 bg-secondary text-secondary-foreground rounded-lg transition-all duration-200 ${linkColors[1]} font-medium shadow-lg hover:shadow-xl hover:scale-105`}
            >
              View Portfolio
            </Link>
            <Link
              to="/about"
              className={`px-6 py-3 bg-accent text-accent-foreground rounded-lg transition-all duration-200 ${linkColors[2]} font-medium shadow-lg hover:shadow-xl hover:scale-105`}
            >
              About Me
            </Link>
          </div>
        </div>
        
        {/* Profile image in corner */}
        <div className="absolute bottom-8 right-8" style={{ zIndex: 10 }}>
          <img
            className="h-20 w-20 rounded-full object-cover border-4 border-primary/30 backdrop-blur-sm shadow-xl"
            src={imageUrl}
            alt={name}
            width={80}
            height={80}
          />
        </div>
      </main>
    </div>
  )
}
