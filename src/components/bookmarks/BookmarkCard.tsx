import React from "react"
import { RaindropBookmark, formatBookmarkDate, getBookmarkType, getTypeIcon } from "../../lib/raindrop-api"

interface BookmarkCardProps {
  bookmark: RaindropBookmark
  showCollection?: boolean
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, showCollection = false }) => {
  const type = getBookmarkType(bookmark)
  const typeIcon = getTypeIcon(type)

  return (
    <article className="bg-card p-component rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-element">
        {bookmark.cover && (
          <div className="flex-shrink-0">
            <img
              src={bookmark.cover}
              alt=""
              className="w-16 h-16 rounded-md object-cover bg-muted"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-element-sm mb-element-sm">
            <h3 className="text-heading-md font-semibold text-foreground leading-tight">
              <a
                href={bookmark.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {bookmark.title}
              </a>
            </h3>
            <span className="text-body-sm flex-shrink-0" title={type}>
              {typeIcon}
            </span>
          </div>

          {bookmark.excerpt && (
            <p className="text-body-sm text-muted-foreground mb-element line-clamp-2">
              {bookmark.excerpt}
            </p>
          )}

          {bookmark.note && (
            <div className="bg-accent/50 p-element-sm rounded mb-element">
              <p className="text-body-sm text-accent-foreground italic">
                Note: {bookmark.note}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-element">
            <div className="flex items-center gap-element text-body-sm text-muted-foreground">
              <span className="font-medium">{bookmark.domain}</span>
              <span>•</span>
              <time dateTime={bookmark.created}>
                {formatBookmarkDate(bookmark.created)}
              </time>
              {showCollection && bookmark.collection?.title && (
                <>
                  <span>•</span>
                  <span className="text-primary">{bookmark.collection.title}</span>
                </>
              )}
            </div>
          </div>

          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-element-xs mt-element">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-caption bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default BookmarkCard