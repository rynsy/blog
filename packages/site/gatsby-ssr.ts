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
  // Temporarily disabled due to network connectivity issues on Cloudflare Pages
  // TODO: Replace with actual New Relic script content when properly configured
  return null
  
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
  
  // Add CSP meta tag for production analytics and monitoring
  if (process.env.NODE_ENV === 'production') {
    const cspMeta = React.createElement('meta', {
      key: 'csp-meta',
      httpEquiv: 'Content-Security-Policy',
      content: "default-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' js-agent.newrelic.com bam.nr-data.net; connect-src 'self' js-agent.newrelic.com bam.nr-data.net *.nr-data.net; img-src 'self' data: *.nr-data.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' data: fonts.gstatic.com; worker-src 'self' blob:;"
    })
    headComponents.push(cspMeta)
  }
  
  // Add New Relic script as first script in head for optimal performance
  const newRelicScript = loadNewRelicScript()
  if (newRelicScript) {
    headComponents.push(newRelicScript)
  }
  
  if (headComponents.length > 0) {
    setHeadComponents(headComponents)
  }
}
