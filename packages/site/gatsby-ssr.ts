/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// Wrap the entire app with providers for SSR consistency
export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

// Use ES6 export for consistency
export const onRenderBody = ({ setHtmlAttributes }) => {
  setHtmlAttributes({ lang: `en` })
}
