"use client"

import React from "react"
import BouncingBall from "./bouncing-ball"

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
      className={`min-h-screen bg-gray-50 flex flex-col ${fontClasses.content} relative overflow-hidden`}
    >
      <BouncingBall />
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full h-full bg-white/80 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden flex flex-col">
          <div className="p-8 flex-grow flex flex-col">
            <div className="mb-6">
              <div className="flex items-start mb-6">
                <img
                  className="h-24 w-24 rounded-full object-cover mr-6"
                  src={imageUrl}
                  alt={name}
                  width={96}
                  height={96}
                />
                <div>
                  <h1
                    className={`text-4xl font-bold text-gray-900 mb-4 ${fontClasses.header}`}
                  >
                    {name}
                  </h1>
                  <p className="text-gray-600">
                    Welcome to my placeholder website. This is very much a
                    work-in-progress, excuse the mess.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-grow" />
            <nav className="flex flex-col items-end space-y-2">
              {[
                { href: "/about", label: "About Me" },
                { href: "/blog", label: "Blog" },
                { href: "/projects", label: "Projects" },
                { href: "/contact", label: "Contact" },
              ].map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-gray-600 hover:text-gray-900 font-medium py-2 px-4 rounded-full transition-all duration-300 ${linkColors[index]} text-right`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </main>
      <footer className="h-12 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm relative z-10">
        <p className="text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
