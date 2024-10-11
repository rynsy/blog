import path from "path"
import { GatsbyNode } from "gatsby"
import { createFilePath } from "gatsby-source-filesystem"

/**
 * @type {import('gatsby').GatsbyNode['createPages']}
 */
export const createPages: GatsbyNode["createPages"] = async ({ graphql, actions }) => {
  const { createPage } = actions
  const result = await graphql<{
    allMarkdownRemark: {
      nodes: Array<{
        id: string
        frontmatter: {
          slug: string
        }
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
    throw result.errors
  }

  result.data?.allMarkdownRemark.nodes.forEach((node) => {
    if (node.frontmatter.slug) {
      createPage({
        path: `/blog/${node.frontmatter.slug}`,
        component: path.resolve(`./src/templates/blog-post.tsx`),
        context: {
          id: node.id,
        },
      })
    }
  })
}

export const onCreateNode: GatsbyNode["onCreateNode"] = ({ node, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    createNodeField({
      node,
      name: `slug`,
      value: node.frontmatter.slug,
    })
  }
}
