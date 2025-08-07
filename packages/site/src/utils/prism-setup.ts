// Import Prism.js languages used in blog posts - client-side only
let Prism: any = null

// Only run on client side and after DOM is ready
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Wait for DOM ready AND React hydration to avoid conflicts with gatsby-remark-prismjs
  const initializePrism = () => {
    try {
      // Check if Prism is already loaded by gatsby-remark-prismjs
      if (window.Prism) {
        Prism = window.Prism
        console.log('🎨 Using existing Prism instance from gatsby-remark-prismjs')
        return
      }
      
      // Otherwise load our own instance
      Prism = require('prismjs')
      
      // Check if Prism is properly initialized
      if (Prism && typeof Prism.languages !== 'undefined') {
        // Import language components safely - order matters (markup must come first)
        const loadLanguage = (lang: string) => {
          try {
            // Skip if already loaded
            if (Prism.languages[lang]) {
              return
            }
            
            // Try to load the language component
            require(`prismjs/components/prism-${lang}`)
            console.log(`✅ Loaded Prism language: ${lang}`)
          } catch (e) {
            console.warn(`⚠️ Failed to load Prism language: ${lang}`, e)
          }
        }
        
        // Load languages in dependency order - cpp depends on c
        loadLanguage('markup')
        loadLanguage('css')
        loadLanguage('javascript') 
        loadLanguage('typescript')
        loadLanguage('python')
        loadLanguage('c')        // cpp depends on c
        loadLanguage('cpp')
        loadLanguage('rust')
        loadLanguage('go')
        loadLanguage('bash')
        loadLanguage('json')
      } else {
        console.warn('⚠️ Prism not properly initialized')
      }
    } catch (error) {
      console.error("❌ Error loading Prism.js:", error)
    }
  }
  
  // Initialize after React hydration is complete to avoid hydration mismatches
  const delayedInit = () => {
    // Use setTimeout to ensure this runs after React hydration
    setTimeout(initializePrism, 0)
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', delayedInit)
  } else {
    // DOM already ready, but still delay for hydration
    delayedInit()
  }
}

export default Prism