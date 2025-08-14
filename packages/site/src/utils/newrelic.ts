// New Relic Browser Agent Configuration
// This initializes New Relic monitoring for the browser

import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

// New Relic configuration from your account
const newRelicConfig = {
  init: {
    privacy: { cookies_enabled: true },
    ajax: { deny_list: ["bam.nr-data.net"] }
  },
  info: {
    beacon: "bam.nr-data.net",
    errorBeacon: "bam.nr-data.net",
    licenseKey: "NRBR-1ee01d1479b9191d26e",
    applicationID: "1589123863",
    sa: 1
  },
  loader_config: {
    accountID: "6576957",
    trustKey: "6576957",
    agentID: "1589123863",
    licenseKey: "NRBR-1ee01d1479b9191d26e",
    applicationID: "1589123863"
  }
}

export const initializeNewRelic = () => {
  // Only load in production (unless explicitly overridden)
  const shouldLoad = process.env.GATSBY_DISABLE_NEW_RELIC !== "true" && 
                    (process.env.NODE_ENV === "production" || process.env.GATSBY_LOAD_NEW_RELIC === "true")
  
  if (typeof window !== 'undefined' && shouldLoad) {
    console.log('Initializing New Relic Browser Agent')
    new BrowserAgent(newRelicConfig)
  }
}