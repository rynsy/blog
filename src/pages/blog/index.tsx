import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../../components/layout"
import SEO from "../../components/seo"

export const query = graphql`
  query {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/content/blog/" } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "MMMM DD, YYYY")
          slug
        }
        excerpt
      }
    }
  }
`

const BlogPage = ({ data }) => (
  <Layout>
    <SEO title="Blog" />
    <div className="space-y-section">
      <h1 className="text-display-md font-bold text-foreground mb-component">Blog</h1>
      <div className="space-y-component">
        {data.allMarkdownRemark.nodes.map(node => (
          <article key={node.id} className="bg-card p-component rounded-lg border shadow-sm">
            <Link
              to={`/blog/${node.frontmatter.slug}`}
              className="group"
            >
              <h2 className="text-heading-lg font-semibold text-primary group-hover:text-primary/80 transition-colors mb-element-sm">
                {node.frontmatter.title}
              </h2>
            </Link>
            <p className="text-body-sm text-muted-foreground mb-element">{node.frontmatter.date}</p>
            <p className="text-body-md text-muted-foreground">{node.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  </Layout>
)

export default BlogPage
