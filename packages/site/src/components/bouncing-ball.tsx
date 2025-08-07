"use client"

import React, { useRef, useEffect } from "react"

interface Ball {
  x: number
  y: number
  radius: number
  dx: number
  dy: number
}

const BouncingBall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const ball: Ball = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 20,
      dx: (Math.random() - 0.5) * 5,
      dy: (Math.random() - 0.5) * 5,
    }

    const animate = () => {
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw ball
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(66, 135, 245, 0.5)"
      ctx.fill()
      ctx.closePath()

      // Bounce off walls
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx
      }
      if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy
      }

      // Move ball
      ball.x += ball.dx
      ball.y += ball.dy

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
    />
  )
}

export default BouncingBall
