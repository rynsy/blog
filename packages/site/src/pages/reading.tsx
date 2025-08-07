import React, { useState, useMemo } from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import ReadingCard from "../components/reading/ReadingCard"

interface ReadingPageData {
  allMarkdownRemark: {
    nodes: Array<{
      id: string
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
        slug: string
      }
    }>
  }
}

const ReadingPage: React.FC<PageProps<ReadingPageData>> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date-desc')

  const allEntries = data.allMarkdownRemark.nodes

  // Get unique values for filters
  const allTypes = useMemo(() => {
    const types = allEntries.map(entry => entry.frontmatter.type)
    return [...new Set(types)].sort()
  }, [allEntries])

  const allTags = useMemo(() => {
    const tags = allEntries.flatMap(entry => entry.frontmatter.tags || [])
    return [...new Set(tags)].sort()
  }, [allEntries])

  const allStatuses = ['read', 'reading', 'to-read']

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = allEntries.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.frontmatter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.frontmatter.author && entry.frontmatter.author.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = !selectedType || entry.frontmatter.type === selectedType
      const matchesStatus = !selectedStatus || entry.frontmatter.status === selectedStatus
      const matchesTag = !selectedTag || (entry.frontmatter.tags && entry.frontmatter.tags.includes(selectedTag))

      return matchesSearch && matchesType && matchesStatus && matchesTag
    })

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
        case 'date-asc':
          return new Date(a.frontmatter.date).getTime() - new Date(b.frontmatter.date).getTime()
        case 'title-asc':
          return a.frontmatter.title.localeCompare(b.frontmatter.title)
        case 'title-desc':
          return b.frontmatter.title.localeCompare(a.frontmatter.title)
        case 'rating-desc':
          return (b.frontmatter.rating || 0) - (a.frontmatter.rating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [allEntries, searchQuery, selectedType, selectedStatus, selectedTag, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedType('')
    setSelectedStatus('')
    setSelectedTag('')
  }

  const hasFilters = searchQuery || selectedType || selectedStatus || selectedTag

  return (
    <Layout>
      <SEO title="Reading" description="My curated collection of articles, papers, books, and resources with commentary." />
      
      <div className="space-y-section">
        {/* Header */}
        <div className="space-y-element">
          <h1 className="text-display-md font-bold text-foreground">Reading</h1>
          <p className="text-body-lg text-muted-foreground">
            My curated collection of articles, papers, books, and resources with commentary and thoughts.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-component space-y-element">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search reading entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-element py-element-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              🔍
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-element">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-element py-element-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Types</option>
              {allTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-element py-element-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Status</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-element py-element-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-element py-element-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-body-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="text-body-sm text-muted-foreground">
          {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'}
          {hasFilters && ' found'}
        </div>

        {/* Reading Entries */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-component">
            {filteredEntries.map((entry) => (
              <ReadingCard
                key={entry.id}
                entry={entry}
                showExcerpt={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-section">
            <div className="text-6xl mb-element">📚</div>
            <h3 className="text-heading-md font-semibold text-foreground mb-element-sm">
              No reading entries found
            </h3>
            <p className="text-body-md text-muted-foreground">
              {hasFilters 
                ? "Try adjusting your filters or search terms."
                : "Start by creating your first reading entry in the content/reading directory."
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ReadingPage

export const query = graphql`
  query ReadingPageQuery {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/content/reading/" } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        excerpt(pruneLength: 200)
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
`