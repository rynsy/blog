import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import { RaindropBookmark, raindropApi, formatBookmarkDate, getBookmarkType, getTypeIcon } from "../../lib/raindrop-api"

interface RecentReadsProps {
  limit?: number
  showViewAll?: boolean
}

const RecentReads: React.FC<RecentReadsProps> = ({ limit = 5, showViewAll = true }) => {
  const [bookmarks, setBookmarks] = useState<RaindropBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentBookmarks = async () => {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const token = process.env.GATSBY_RAINDROP_TOKEN
      if (!token) {
        console.log('Raindrop token not found in environment')
        setLoading(false)
        setError('Raindrop token not configured')
        return
      }

      try {
        console.log('Fetching recent bookmarks...')
        const recentBookmarks = await raindropApi.getRecentBookmarks(limit)
        console.log('Fetched bookmarks:', recentBookmarks.length)
        setBookmarks(recentBookmarks)
      } catch (err) {
        console.error('Failed to fetch recent bookmarks:', err)
        setError('Failed to load recent reads')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBookmarks()
  }, [limit])

  if (loading) {
    return (
      <section className="space-y-component">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-lg font-semibold text-foreground">Recent Reads</h2>
        </div>
        <div className="space-y-element">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-element animate-pulse">
              <div className="w-12 h-12 bg-muted rounded flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || bookmarks.length === 0) {
    return null // Don't show section if there's an error or no bookmarks
  }

  return (
    <section className="space-y-component">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-lg font-semibold text-foreground">Recent Reads</h2>
        {showViewAll && (
          <Link
            to="/bookmarks"
            className="text-body-md text-primary hover:text-primary/80 transition-colors font-medium"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="space-y-element">
        {bookmarks.map((bookmark) => {
          const type = getBookmarkType(bookmark)
          const typeIcon = getTypeIcon(type)

          return (
            <article key={bookmark._id} className="flex gap-element group">
              <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-lg">
                {bookmark.cover ? (
                  <img
                    src={bookmark.cover}
                    alt=""
                    className="w-full h-full rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span>{typeIcon}</span>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <h3 className="text-body-md font-medium text-foreground leading-tight mb-1">
                  <a
                    href={bookmark.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors group-hover:text-primary"
                  >
                    {bookmark.title}
                  </a>
                </h3>

                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <span>{bookmark.domain}</span>
                  <span>•</span>
                  <time dateTime={bookmark.created}>
                    {formatBookmarkDate(bookmark.created)}
                  </time>
                </div>

                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bookmark.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {bookmark.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{bookmark.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default RecentReads