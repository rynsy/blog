import React from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import "katex/dist/katex.min.css"
import "prismjs/themes/prism.css"
import "../styles/syntax-highlighting.css"

const BlogPostTemplate: React.FC<PageProps<Queries.BlogPostBySlugQuery, { isDraft: boolean; isProduction: boolean }>> = ({
  data,
  location,
  pageContext,
}) => {
  const post = data.markdownRemark
  const siteTitle = data.site?.siteMetadata?.title || `Title`
  const { isDraft, isProduction } = pageContext

  if (!post) {
    return <div>Post not found</div>
  }

  return (
    <Layout>
      <SEO title={post.frontmatter.title} description={post.excerpt} />
      <article className="prose prose-lg max-w-none">
        <header className="mb-section">
          {isDraft && !isProduction && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                📝 This is a draft post - only visible in development
              </p>
            </div>
          )}
          <h1 className="text-display-xl font-bold text-foreground mb-2 font-serif">{post.frontmatter.title}</h1>
          <time className="text-body-sm text-foreground/70 font-medium drop-shadow-sm">{post.frontmatter.date}</time>
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
        draft
        published
      }
    }
  }
`
