/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import "./src/styles/global.css"
import React from "react"
import RootWrapper from "./src/components/RootWrapper"

// New Relic Browser Agent - only loaded in production
const loadNewRelicScripts = () => {
  // Only load in production builds
  if (process.env.NODE_ENV === 'production') {
    return [
      // New Relic configuration script (must load first)
      React.createElement('script', {
        key: 'nr-config',
        dangerouslySetInnerHTML: {
          __html: `;window.NREUM||(NREUM={});NREUM.init={distributed_tracing:{enabled:true},privacy:{cookies_enabled:true},ajax:{deny_list:["bam.nr-data.net"]}};NREUM.loader_config={accountID:"6576957",trustKey:"6576957",agentID:"1589121593",licenseKey:"NRBR-1ee01d1479b9191d26e",applicationID:"1589121593"};NREUM.info={beacon:"bam.nr-data.net",errorBeacon:"bam.nr-data.net",licenseKey:"NRBR-1ee01d1479b9191d26e",applicationID:"1589121593",sa:1};`
        }
      }),
      // New Relic CDN script (loads after config)
      React.createElement('script', {
        key: 'nr-loader',
        src: 'https://js-agent.newrelic.com/nr-spa-1.293.0.min.js',
        async: true
      })
    ]
  }
  return []
}

// Wrap the entire app with providers for SSR consistency
export const wrapRootElement = ({ element }) => {
  return React.createElement(RootWrapper, null, element)
}

// Use ES6 export for consistency
export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: `en` })
  
  const headComponents = []
  
  // Add production-specific meta tags
  if (process.env.NODE_ENV === 'production') {
    // Disable Cloudflare Web Analytics script injection
    const disableCloudflareAnalytics = React.createElement('meta', {
      key: 'disable-cf-analytics',
      name: 'cloudflare-web-analytics',
      content: 'false'
    })
    headComponents.push(disableCloudflareAnalytics)
  }
  
  // Add New Relic scripts as first scripts in head for optimal performance
  const newRelicScripts = loadNewRelicScripts()
  if (newRelicScripts.length > 0) {
    headComponents.push(...newRelicScripts)
  }
  
  if (headComponents.length > 0) {
    setHeadComponents(headComponents)
  }
}
