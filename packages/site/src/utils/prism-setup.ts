// Import Prism.js languages used in blog posts - client-side only
let Prism: any = null

if (typeof window !== "undefined") {
  try {
    // Only load Prism on the client side with static imports
    Prism = require('prismjs')
    
    // Import language components - order matters (markup must come first)
    require('prismjs/components/prism-markup')
    require('prismjs/components/prism-css')  
    require('prismjs/components/prism-javascript')
    require('prismjs/components/prism-typescript')
    require('prismjs/components/prism-python')
    require('prismjs/components/prism-cpp')
    require('prismjs/components/prism-rust')
    require('prismjs/components/prism-go')
    require('prismjs/components/prism-bash')
    require('prismjs/components/prism-json')
  } catch (error) {
    console.warn("Error loading Prism.js:", error)
  }
}

export default Prism