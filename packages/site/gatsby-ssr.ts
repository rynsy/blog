/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

const loadNewRelicScripts = () => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DISABLE_NEW_RELIC !== "true"
  ) {
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
  if (process.env.NODE_ENV === "production") {
    const newRelicScripts = loadNewRelicScripts()
    if (newRelicScripts.length > 0) headComponents.push(...newRelicScripts)
  }
  if (headComponents.length > 0) setHeadComponents(headComponents)
}
