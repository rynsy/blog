import React from "react"
import { Link, graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import "katex/dist/katex.min.css"
import "prismjs/themes/prism.css"
import "../styles/syntax-highlighting.css"

interface BlogPostData {
  site?: {
    siteMetadata?: {
      title?: string
    }
  }
  markdownRemark?: {
    id: string
    excerpt: string
    html: string
    timeToRead: number
    frontmatter: {
      title: string
      date: string
      slug: string
      draft?: boolean
      categories?: string[]
      tags?: string[]
    }
  }
}

const BlogPostTemplate: React.FC<PageProps<BlogPostData, { isDraft: boolean; isProduction: boolean }>> = ({
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
      <article className="prose prose-lg max-w-none" role="article">
        <header className="mb-section">
          {isDraft && !isProduction && (
            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                📝 This is a draft post - only visible in development
              </p>
            </div>
          )}
          <h1 className="text-display-xl font-bold text-foreground mb-4 font-serif">{post.frontmatter.title}</h1>
          
          <div className="flex items-center gap-4 mb-4 text-body-sm text-foreground/70 font-medium">
            <time className="drop-shadow-sm">{post.frontmatter.date}</time>
            <span className="drop-shadow-sm">{post.timeToRead} min read</span>
          </div>
          
          {/* Categories and Tags */}
          {(post.frontmatter.categories || post.frontmatter.tags) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.frontmatter.categories?.map((category: string) => (
                <span
                  key={category}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {category}
                </span>
              ))}
              {post.frontmatter.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-muted text-foreground border border-border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>
        <div 
          className="prose prose-lg max-w-none text-body-md text-foreground leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: post.html }}
          role="main"
          aria-label="Article content"
        />
        
        {/* Back to Blog Link */}
        <footer className="mt-section pt-component border-t border-border">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
            aria-label="Return to blog post listing"
          >
            <span aria-hidden="true">←</span> Back to all posts
          </Link>
        </footer>
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
      timeToRead
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        slug
        draft
        categories
        tags
      }
    }
  }
`
