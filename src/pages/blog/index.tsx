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
    <div className="space-y-8">
      {data.allMarkdownRemark.nodes.map((node) => (
        <div key={node.id} className="bg-white p-6 rounded shadow">
          <Link to={`/blog/${node.frontmatter.slug}`} className="text-2xl font-bold text-blue-600 hover:text-blue-800">
            <h2>{node.frontmatter.title}</h2>
          </Link>
          <p className="text-gray-600 mb-2">{node.frontmatter.date}</p>
          <p>{node.excerpt}</p>
        </div>
      ))}
    </div>
  </Layout>
)

export default BlogPage