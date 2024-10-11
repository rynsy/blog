import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../../components/layout"
import SEO from "../../components/seo"

export const query = graphql`
  query {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
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
    <h1>Blog</h1>
    {data.allMarkdownRemark.nodes.map((node) => (
      <div key={node.id}>
        <Link to={`/blog/${node.frontmatter.slug}`}>
          <h2>{node.frontmatter.title}</h2>
        </Link>
        <p>{node.frontmatter.date}</p>
        <p>{node.excerpt}</p>
      </div>
    ))}
  </Layout>
)

export default BlogPage