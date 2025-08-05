// Import Prism.js languages used in blog posts - client-side only
let Prism: any = null

// Function to safely load a Prism component
const loadPrismComponent = (componentPath: string, componentName: string) => {
  try {
    require(componentPath)
  } catch (error) {
    console.warn(`Failed to load Prism component ${componentName}:`, error)
  }
}

if (typeof window !== "undefined") {
  try {
    // Only load Prism on the client side
    Prism = require("prismjs")
    
    // Ensure Prism is properly initialized
    if (Prism && Prism.languages) {
      // Load core language first (markup/html is the base)
      loadPrismComponent("prismjs/components/prism-markup", "markup")
      loadPrismComponent("prismjs/components/prism-css", "css")
      loadPrismComponent("prismjs/components/prism-javascript", "javascript")
      loadPrismComponent("prismjs/components/prism-typescript", "typescript")
      loadPrismComponent("prismjs/components/prism-python", "python")
      loadPrismComponent("prismjs/components/prism-cpp", "cpp")
      loadPrismComponent("prismjs/components/prism-rust", "rust")
      loadPrismComponent("prismjs/components/prism-go", "go")
      loadPrismComponent("prismjs/components/prism-bash", "bash")
      loadPrismComponent("prismjs/components/prism-json", "json")
    }
  } catch (error) {
    console.warn("Error initializing Prism.js:", error)
  }
}

// Export Prism for use elsewhere if needed
export default Prism