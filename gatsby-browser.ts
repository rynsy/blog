import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// Wrap the entire app with ThemeProvider
export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}
