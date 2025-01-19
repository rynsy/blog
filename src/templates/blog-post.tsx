import React from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"

const BlogPostTemplate: React.FC<PageProps<Queries.BlogPostBySlugQuery>> = ({
  data,
  location,
}) => {
  const post = data.markdownRemark
  const siteTitle = data.site?.siteMetadata?.title || `Title`

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <Layout location={location} title={siteTitle}>
      <div>Can you see me? </div>
      <SEO title={post.frontmatter.title} description={post.excerpt} />
      <div>
        <h1>{post.frontmatter.title}</h1>
        <small>{post.frontmatter.date}</small>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($id: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        slug
      }
    }
  }
`
