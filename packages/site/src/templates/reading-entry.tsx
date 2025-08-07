import React from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"

interface ReadingEntryData {
  markdownRemark: {
    id: string
    html: string
    excerpt: string
    frontmatter: {
      title: string
      url: string
      type: string
      tags: string[]
      date: string
      rating?: number
      status: 'read' | 'reading' | 'to-read'
      author?: string
      publication?: string
    }
  }
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const ReadingEntryTemplate: React.FC<PageProps<ReadingEntryData>> = ({
  data,
}) => {
  const entry = data.markdownRemark
  const siteTitle = data.site?.siteMetadata?.title || `Title`

  if (!entry) {
    return <div>Reading entry not found</div>
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      paper: '📑',
      article: '📄',
      book: '📚',
      video: '🎥',
      tool: '🔧',
      course: '🎓',
      podcast: '🎧',
      link: '🔗'
    }
    return icons[type] || '🔗'
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    return '⭐'.repeat(rating)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'read': { label: 'Read', class: 'bg-green-100 text-green-800' },
      'reading': { label: 'Currently Reading', class: 'bg-blue-100 text-blue-800' },
      'to-read': { label: 'To Read', class: 'bg-gray-100 text-gray-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['read']
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-caption font-medium ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <Layout>
      <SEO title={entry.frontmatter.title} description={entry.excerpt} />
      
      <article className="max-w-none">
        {/* Header */}
        <header className="mb-section border-b pb-component">
          <div className="flex items-start gap-element mb-element">
            <span className="text-2xl">{getTypeIcon(entry.frontmatter.type)}</span>
            <div className="flex-grow">
              <h1 className="text-display-sm font-bold text-foreground mb-element-sm">
                {entry.frontmatter.title}
              </h1>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-element text-body-sm text-foreground/70 mb-element drop-shadow-sm">
                <time dateTime={entry.frontmatter.date}>
                  {new Date(entry.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                
                {entry.frontmatter.author && (
                  <>
                    <span>•</span>
                    <span>by {entry.frontmatter.author}</span>
                  </>
                )}
                
                {entry.frontmatter.publication && (
                  <>
                    <span>•</span>
                    <span>{entry.frontmatter.publication}</span>
                  </>
                )}
              </div>

              {/* Status and Rating */}
              <div className="flex flex-wrap items-center gap-element mb-element">
                {getStatusBadge(entry.frontmatter.status)}
                
                {entry.frontmatter.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-body-sm text-muted-foreground">Rating:</span>
                    <span className="text-body-sm">{getRatingStars(entry.frontmatter.rating)}</span>
                  </div>
                )}
              </div>

              {/* Original Link */}
              <div className="mb-element">
                <a
                  href={entry.frontmatter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-body-md font-medium"
                >
                  Read Original →
                </a>
              </div>

              {/* Tags */}
              {entry.frontmatter.tags && entry.frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-caption bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none text-body-md text-foreground leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: entry.html }} 
        />
      </article>
    </Layout>
  )
}

export default ReadingEntryTemplate

export const pageQuery = graphql`
  query ReadingEntryBySlug($id: String!) {
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
        url
        type
        tags
        date(formatString: "YYYY-MM-DD")
        rating
        status
        author
        publication
      }
    }
  }
`