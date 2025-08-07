/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// New Relic Browser Agent - only loaded in production
const loadNewRelicScript = () => {
  // Only load in production builds
  if (process.env.NODE_ENV === 'production') {
    // Load the script from the static file - will be handled by webpack
    return React.createElement('script', {
      key: 'newrelic-browser-agent',
      type: 'text/javascript',
      src: '/scripts/newrelic-browser-agent.js'
    })
  }
  return null
}

// Wrap the entire app with providers for SSR consistency
export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

// Use ES6 export for consistency
export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: `en` })
  
  const headComponents = []
  
  // Add New Relic script as first script in head for optimal performance
  const newRelicScript = loadNewRelicScript()
  if (newRelicScript) {
    headComponents.push(newRelicScript)
  }
  
  if (headComponents.length > 0) {
    setHeadComponents(headComponents)
  }
}
