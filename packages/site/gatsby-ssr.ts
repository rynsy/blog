/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// New Relic configuration via NPM package
// Import is handled in the main app component to initialize as early as possible

export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

export const onRenderBody = ({ setHtmlAttributes }) => {
  setHtmlAttributes({ lang: `en` })
}
