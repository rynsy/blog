// Import Prism.js languages used in blog posts - client-side only
let Prism: any = null

if (typeof window !== "undefined") {
  // Only load Prism on the client side
  Prism = require("prismjs")
  require("prismjs/components/prism-python")
  require("prismjs/components/prism-javascript")
  require("prismjs/components/prism-typescript")
  require("prismjs/components/prism-cpp")
  require("prismjs/components/prism-rust")
  require("prismjs/components/prism-go")
  require("prismjs/components/prism-bash")
  require("prismjs/components/prism-json")
  require("prismjs/components/prism-css")
  require("prismjs/components/prism-markup")
  require("prismjs/plugins/line-numbers/prism-line-numbers")
}

// Export Prism for use elsewhere if needed
export default Prism