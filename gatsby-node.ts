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
        frontmatter: { slug: string }
      }>
    }
  }>(`
    query {
      allMarkdownRemark {
        nodes {
          id
          frontmatter {
            slug
          }
        }
      }
    }
  `)

  if (result.errors || !result.data) {
    throw result.errors || new Error("No data returned from GraphQL query")
  }

  result.data.allMarkdownRemark.nodes.forEach(node => {
    if (node.frontmatter.slug) {
      createPage({
        path: `/blog/${node.frontmatter.slug}`,
        component: path.resolve(`./src/templates/blog-post.tsx`),
        context: { id: node.id },
      })
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
