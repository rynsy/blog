import React, { useState } from "react"
import { RaindropCollection } from "../../lib/raindrop-api"

interface BookmarkFilterProps {
  collections: RaindropCollection[]
  tags: string[]
  selectedCollection?: number
  selectedTags: string[]
  selectedType?: string
  searchQuery: string
  onCollectionChange: (collectionId?: number) => void
  onTagsChange: (tags: string[]) => void
  onTypeChange: (type?: string) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
}

const BookmarkFilter: React.FC<BookmarkFilterProps> = ({
  collections,
  tags,
  selectedCollection,
  selectedTags,
  selectedType,
  searchQuery,
  onCollectionChange,
  onTagsChange,
  onTypeChange,
  onSearchChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const bookmarkTypes = [
    { value: 'article', label: '📄 Articles', icon: '📄' },
    { value: 'video', label: '🎥 Videos', icon: '🎥' },
    { value: 'link', label: '🔗 Links', icon: '🔗' },
    { value: 'document', label: '📑 Documents', icon: '📑' },
    { value: 'image', label: '🖼️ Images', icon: '🖼️' },
  ]

  const hasActiveFilters = selectedCollection || selectedTags.length > 0 || selectedType || searchQuery

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  return (
    <div className="bg-card border rounded-lg p-component space-y-element">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-element py-element-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          🔍
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-body-md font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>Filters</span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-body-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="space-y-element pt-element border-t">
          {/* Collections */}
          {collections.length > 0 && (
            <div>
              <h4 className="text-body-md font-medium text-foreground mb-element-sm">Collections</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="collection"
                    checked={!selectedCollection}
                    onChange={() => onCollectionChange(undefined)}
                    className="text-primary focus:ring-ring"
                  />
                  <span className="text-body-sm">All Collections</span>
                </label>
                {collections.map((collection) => (
                  <label key={collection._id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="collection"
                      checked={selectedCollection === collection._id}
                      onChange={() => onCollectionChange(collection._id)}
                      className="text-primary focus:ring-ring"
                    />
                    <span className="text-body-sm">
                      {collection.title} ({collection.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Types */}
          <div>
            <h4 className="text-body-md font-medium text-foreground mb-element-sm">Type</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={!selectedType}
                  onChange={() => onTypeChange(undefined)}
                  className="text-primary focus:ring-ring"
                />
                <span className="text-body-sm">All Types</span>
              </label>
              {bookmarkTypes.map((type) => (
                <label key={type.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    checked={selectedType === type.value}
                    onChange={() => onTypeChange(type.value)}
                    className="text-primary focus:ring-ring"
                  />
                  <span className="text-body-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-body-md font-medium text-foreground mb-element-sm">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-caption border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {tags.length > 20 && (
                  <span className="text-caption text-muted-foreground px-3 py-1">
                    +{tags.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BookmarkFilter