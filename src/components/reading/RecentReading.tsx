import React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"
import ReadingCard from "./ReadingCard"

interface RecentReadingProps {
  limit?: number
  showViewAll?: boolean
}

const RecentReading: React.FC<RecentReadingProps> = ({ limit = 3, showViewAll = true }) => {
  const data = useStaticQuery(graphql`
    query RecentReadingQuery {
      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/reading/" } }
        sort: { frontmatter: { date: DESC } }
        limit: 5
      ) {
        nodes {
          id
          excerpt(pruneLength: 150)
          frontmatter {
            title
            url
            type
            tags
            date
            rating
            status
            author
            publication
            slug
          }
        }
      }
    }
  `)

  const readingEntries = data.allMarkdownRemark.nodes.slice(0, limit)

  if (readingEntries.length === 0) {
    return null // Don't show section if no reading entries
  }

  return (
    <section className="bg-card/60 backdrop-blur-sm rounded-lg p-element border space-y-element-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-sm font-semibold text-foreground">Recent Reading</h3>
        {showViewAll && (
          <Link
            to="/reading"
            className="text-body-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="space-y-element-xs">
        {readingEntries.map((entry) => (
          <div key={entry.id} className="group">
            <Link
              to={`/reading/${entry.frontmatter.slug}`}
              className="block p-element-sm bg-card/40 rounded border hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start gap-element-xs">
                <span className="text-sm flex-shrink-0">
                  {entry.frontmatter.type === 'article' ? '📄' : 
                   entry.frontmatter.type === 'book' ? '📚' : 
                   entry.frontmatter.type === 'paper' ? '📑' : '🔗'}
                </span>
                <div className="min-w-0 flex-grow">
                  <h4 className="text-body-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {entry.frontmatter.title}
                  </h4>
                  <p className="text-caption text-muted-foreground mt-1">
                    {new Date(entry.frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default RecentReading