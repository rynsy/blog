import React from "react"
import { Link } from "gatsby"

interface ReadingEntry {
  id: string
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
    slug: string
  }
  excerpt: string
}

interface ReadingCardProps {
  entry: ReadingEntry
  showExcerpt?: boolean
}

const ReadingCard: React.FC<ReadingCardProps> = ({ entry, showExcerpt = true }) => {
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

  const getStatusColor = (status: string) => {
    const colors = {
      'read': 'text-green-600',
      'reading': 'text-blue-600',
      'to-read': 'text-gray-600'
    }
    return colors[status as keyof typeof colors] || colors['read']
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <article className="bg-white/10 backdrop-blur-sm p-component rounded-lg border border-white/20 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-element">
        <div className="flex-shrink-0 text-2xl">
          {getTypeIcon(entry.frontmatter.type)}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-element-sm mb-element-sm">
            <h3 className="text-heading-md font-semibold text-foreground leading-tight">
              <Link
                to={`/reading/${entry.frontmatter.slug}`}
                className="hover:text-primary transition-colors"
              >
                {entry.frontmatter.title}
              </Link>
            </h3>
            
            {entry.frontmatter.rating && (
              <span className="flex-shrink-0 text-body-sm">
                {getRatingStars(entry.frontmatter.rating)}
              </span>
            )}
          </div>

          {showExcerpt && entry.excerpt && (
            <p className="text-body-sm text-foreground/70 mb-element line-clamp-2 drop-shadow-sm">
              {entry.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between gap-element mb-element">
            <div className="flex items-center gap-element text-body-sm text-foreground/70 drop-shadow-sm">
              <span className={`font-medium capitalize ${getStatusColor(entry.frontmatter.status)}`}>
                {entry.frontmatter.status.replace('-', ' ')}
              </span>
              <span>•</span>
              <time dateTime={entry.frontmatter.date}>
                {formatDate(entry.frontmatter.date)}
              </time>
              {entry.frontmatter.author && (
                <>
                  <span>•</span>
                  <span>{entry.frontmatter.author}</span>
                </>
              )}
            </div>
            
            <a
              href={entry.frontmatter.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors text-body-sm font-medium flex-shrink-0"
              title="Read original"
            >
              →
            </a>
          </div>

          {entry.frontmatter.tags && entry.frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-element-xs">
              {entry.frontmatter.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-caption bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
              {entry.frontmatter.tags.length > 4 && (
                <span className="text-caption text-foreground/70 px-2 py-1 drop-shadow-sm">
                  +{entry.frontmatter.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default ReadingCard