// New Relic Browser Agent Configuration
// Optimized implementation using environment variables

// New Relic configuration using environment variables
const newRelicConfig = {
  init: {
    privacy: { cookies_enabled: true },
    ajax: { deny_list: ["bam.nr-data.net"] }
  },
  info: {
    beacon: "bam.nr-data.net",
    errorBeacon: "bam.nr-data.net",
    licenseKey: process.env.GATSBY_NEW_RELIC_LICENSE_KEY || "NRBR-1ee01d1479b9191d26e",
    applicationID: process.env.GATSBY_NEW_RELIC_APP_ID || "1589123863",
    sa: 1
  },
  loader_config: {
    accountID: process.env.GATSBY_NEW_RELIC_ACCOUNT_ID || "6576957",
    trustKey: process.env.GATSBY_NEW_RELIC_ACCOUNT_ID || "6576957",
    agentID: process.env.GATSBY_NEW_RELIC_APP_ID || "1589123863",
    licenseKey: process.env.GATSBY_NEW_RELIC_LICENSE_KEY || "NRBR-1ee01d1479b9191d26e",
    applicationID: process.env.GATSBY_NEW_RELIC_APP_ID || "1589123863"
  }
}

export const initializeNewRelic = () => {
  // Only load in production (unless explicitly overridden)
  const shouldLoad = process.env.GATSBY_DISABLE_NEW_RELIC !== "true" && 
                    (process.env.NODE_ENV === "production" || process.env.GATSBY_LOAD_NEW_RELIC === "true")
  
  // More defensive window check - ensure window is actually an object
  const isValidWindow = typeof window !== 'undefined' && 
                       window !== null && 
                       window !== false && 
                       typeof window === 'object' &&
                       window.document
  
  if (isValidWindow && shouldLoad) {
    try {
      console.log('Initializing New Relic Browser Agent')
      // Dynamic import to prevent SSR issues
      import('@newrelic/browser-agent/loaders/browser-agent').then(({ BrowserAgent }) => {
        new BrowserAgent(newRelicConfig)
      }).catch(error => {
        console.warn('New Relic dynamic import failed:', error)
      })
    } catch (error) {
      console.warn('New Relic initialization failed:', error)
    }
  } else {
    console.log('New Relic skipped - invalid environment or disabled', {
      window: typeof window,
      shouldLoad,
      NODE_ENV: process.env.NODE_ENV,
      GATSBY_DISABLE_NEW_RELIC: process.env.GATSBY_DISABLE_NEW_RELIC
    })
  }
}