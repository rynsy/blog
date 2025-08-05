"use client"

import React from "react"
import BouncingBall from "./bouncing-ball"
import { Link } from "gatsby"
import RecentReading from "./reading/RecentReading"

// Define font classes
const fontClasses = {
  header: "font-display",
  content: "font-sans",
}

// Define link colors
const linkColors = [
  "hover:bg-pink-200 hover:text-pink-800",
  "hover:bg-purple-200 hover:text-purple-800",
  "hover:bg-blue-200 hover:text-blue-800",
  "hover:bg-green-200 hover:text-green-800",
]

interface LandingPageProps {
  name?: string
  imageUrl?: string
}

export function LandingPageComponent({
  name = "Ryan Lindsey",
  imageUrl = "/placeholder.svg",
}: LandingPageProps) {
  return (
    <div
      className={`min-h-screen bg-background flex flex-col ${fontClasses.content} relative overflow-hidden`}
    >
      <BouncingBall />
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full h-full bg-card/80 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden relative">
          <div className="p-section-sm h-full flex flex-col">
            <div className="mb-component">
              <div className="flex items-start mb-component">
                <img
                  className="h-24 w-24 rounded-full object-cover mr-component"
                  src={imageUrl}
                  alt={name}
                  width={96}
                  height={96}
                />
                <div>
                  <h1
                    className={`text-display-sm font-bold text-foreground mb-element ${fontClasses.header}`}
                  >
                    {name}
                  </h1>
                  <p className="text-muted-foreground text-body-lg">
                    Welcome to my placeholder website. This is very much a
                    work-in-progress, excuse the mess.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-grow" />
            <nav className="flex flex-col items-end gap-element-sm">
              {[
                { href: "/about", label: "About Me" },
                { href: "/blog", label: "Blog" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/reading", label: "Reading" },
                { href: "/contact", label: "Contact" },
              ].map((link, index) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-primary hover:text-primary/80 transition-colors text-body-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Recent Reading Section - Bottom Left */}
          <div className="absolute bottom-4 left-4 w-80 max-w-[calc(100%-2rem)]">
            <RecentReading limit={2} showViewAll={true} />
          </div>
        </div>
      </main>
    </div>
  )
}
