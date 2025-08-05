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
      <SEO title={post.frontmatter.title} description={post.excerpt} />
      <article className="prose prose-lg max-w-none">
        <header className="mb-section">
          <h1 className="text-display-md font-bold text-foreground mb-element">{post.frontmatter.title}</h1>
          <time className="text-body-sm text-muted-foreground">{post.frontmatter.date}</time>
        </header>
        <div 
          className="prose prose-lg max-w-none text-body-md text-foreground leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: post.html }} 
        />
      </article>
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
