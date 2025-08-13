/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

const loadNewRelicScripts = () => {
  // Allow loading in both development and production for testing
  // In a real deployment, you'd want to restrict this to production only
  const shouldLoad = process.env.DISABLE_NEW_RELIC !== "true"
  
  console.log('New Relic loading check:', {
    NODE_ENV: process.env.NODE_ENV,
    DISABLE_NEW_RELIC: process.env.DISABLE_NEW_RELIC,
    shouldLoad
  })
  
  if (shouldLoad) {
    return [
      React.createElement("script", {
        key: "nr-local",
        src: "/new-relic-agent.min.js",
        async: true,
      }),
    ]
  }
  return []
}

export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: `en` })
  const headComponents = []
  
  // Load New Relic scripts (respects DISABLE_NEW_RELIC environment variable)
  const newRelicScripts = loadNewRelicScripts()
  if (newRelicScripts.length > 0) headComponents.push(...newRelicScripts)
  
  if (headComponents.length > 0) setHeadComponents(headComponents)
}
