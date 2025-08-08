import path from "path"
import { GatsbyNode } from "gatsby"

/**
 * Create pages dynamically from MarkdownRemark nodes
 */
export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions,
}) => {
  const { createPage } = actions

  const result = await graphql<{
    allMarkdownRemark: {
      nodes: Array<{
        id: string
        frontmatter: { 
          slug: string
          draft?: boolean
          published?: boolean
        }
        fileAbsolutePath: string
      }>
    }
  }>(`
    query {
      allMarkdownRemark {
        nodes {
          id
          frontmatter {
            slug
            draft
            published
          }
          fileAbsolutePath
        }
      }
    }
  `)

  if (result.errors || !result.data) {
    throw result.errors || new Error("No data returned from GraphQL query")
  }

  // Determine deployment environment
  const isProduction = process.env.NODE_ENV === 'production' && process.env.GATSBY_ENV === 'production'
  const isDevelopment = !isProduction
  
  console.log(`🚀 Building for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`)

  result.data.allMarkdownRemark.nodes.forEach(node => {
    if (node.frontmatter.slug) {
      // Check draft/published status
      const isDraft = node.frontmatter.draft === true
      const isPublished = node.frontmatter.published !== false && !isDraft
      
      // In production, only show published posts
      // In development, show all posts but mark drafts
      const shouldCreatePage = isDevelopment || (isProduction && isPublished)
      
      if (!shouldCreatePage) {
        console.log(`📝 Skipping ${isDraft ? 'draft' : 'unpublished'} post: ${node.frontmatter.slug}`)
        return
      }
      
      // Determine if this is a blog post or reading entry based on file path
      const isReadingEntry = node.fileAbsolutePath.includes('/content/reading/')
      const isBlogPost = node.fileAbsolutePath.includes('/content/blog/')
      
      if (isBlogPost) {
        createPage({
          path: `/blog/${node.frontmatter.slug}`,
          component: path.resolve(`./src/templates/blog-post.tsx`),
          context: { 
            id: node.id,
            isDraft: isDraft,
            isProduction: isProduction
          },
        })
        
        if (isDevelopment && isDraft) {
          console.log(`📝 Created draft blog post: /blog/${node.frontmatter.slug}`)
        }
      } else if (isReadingEntry) {
        createPage({
          path: `/reading/${node.frontmatter.slug}`,
          component: path.resolve(`./src/templates/reading-entry.tsx`),
          context: { 
            id: node.id,
            isDraft: isDraft,
            isProduction: isProduction
          },
        })
        
        if (isDevelopment && isDraft) {
          console.log(`📝 Created draft reading entry: /reading/${node.frontmatter.slug}`)
        }
      }
    }
  })
}

/**
 * Add slugs to MarkdownRemark nodes
 */
export const onCreateNode: GatsbyNode["onCreateNode"] = ({ node, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark` && node.frontmatter.slug) {
    createNodeField({
      node,
      name: "slug",
      value: node.frontmatter.slug,
    })
  }
}

/**
 * Webpack configuration with fallback polyfills
 */
export const onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        "@/components": path.resolve(__dirname, "src/components"),
        "@/lib/utils": path.resolve(__dirname, "src/lib/utils"),
      },
    },
  })
}
