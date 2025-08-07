import React from "react"
import BookmarkCard from "./BookmarkCard"
import { RaindropBookmark } from "../../lib/raindrop-api"

interface BookmarkGridProps {
  bookmarks: RaindropBookmark[]
  loading?: boolean
  showCollection?: boolean
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ 
  bookmarks, 
  loading = false, 
  showCollection = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-component">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card p-component rounded-lg border animate-pulse">
            <div className="flex gap-element">
              <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-section">
        <div className="text-6xl mb-element">🔖</div>
        <h3 className="text-heading-md font-semibold text-foreground mb-element-sm">
          No bookmarks found
        </h3>
        <p className="text-body-md text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-component">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark._id}
          bookmark={bookmark}
          showCollection={showCollection}
        />
      ))}
    </div>
  )
}

export default BookmarkGrid