import "./src/styles/global.css"
import React from "react"
import { ThemeProvider, WrapRootElementProps } from "./src/contexts/ThemeContext"

// Wrap the entire app with ThemeProvider
export const wrapRootElement = ({ element }: WrapRootElementProps) => {
  return React.createElement(ThemeProvider, null, element)
}
