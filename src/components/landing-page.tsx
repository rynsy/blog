"use client"

import React, { useState, useEffect } from "react"
import { Link } from "gatsby"
import InteractiveGraph from "./InteractiveGraph"
import { useBackground } from "../contexts/BackgroundContext"

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
  console.log('🌟 LandingPage: Rendering LandingPageComponent')
  
  // Test if background context is available
  try {
    const { currentModule, isActive, modules } = useBackground()
    console.log('🌟 LandingPage: Background context available:', {
      currentModule,
      isActive,
      moduleCount: Object.keys(modules).length
    })
  } catch (error) {
    console.error('🌟 LandingPage: Background context NOT available:', error)
  }
  
  return (
    <div className="relative min-h-[calc(100vh-theme(spacing.32))] flex flex-col">
      {/* Main Content - Interactive Graph */}
      <main className="flex-1 relative flex items-center justify-center">
        {/* Interactive Graph Visualization */}
        <div className="text-center">
          <div className="mb-6">
            <h2 className={`text-display-sm font-bold text-foreground mb-4 ${fontClasses.header}`}>
              Explore & Connect
            </h2>
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
            <p className="text-foreground/80 text-body-md font-medium drop-shadow-sm">
              Software Engineer
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
