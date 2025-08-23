import React, { useState, useMemo } from "react"
import { Link, graphql, HeadFC } from "gatsby"
import Layout from "../../components/layout"
import SEO from "../../components/seo"

export const query = graphql`
  query {
    allMarkdownRemark(
      filter: { 
        fileAbsolutePath: { regex: "/content/blog/" }
        frontmatter: { draft: { ne: true } }
      }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        frontmatter {
          title
          date(formatString: "MMMM DD, YYYY")
          slug
          categories
          tags
          draft
        }
        excerpt
        rawMarkdownBody
        timeToRead
      }
    }
  }
`

interface BlogNode {
  id: string
  frontmatter: {
    title: string
    date: string
    slug: string
    categories?: string[]
    tags?: string[]
    draft?: boolean
  }
  excerpt: string
  rawMarkdownBody: string
  timeToRead: number
}

interface BlogPageProps {
  data: {
    allMarkdownRemark: {
      nodes: BlogNode[]
    }
  }
}

const BlogPage: React.FC<BlogPageProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const allPosts = data.allMarkdownRemark.nodes

  // Extract all unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    allPosts.forEach(post => {
      post.frontmatter.categories?.forEach(cat => categories.add(cat))
      post.frontmatter.tags?.forEach(tag => categories.add(tag))
    })
    return Array.from(categories).sort()
  }, [allPosts])

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesSearch = searchTerm === '' || 
        post.frontmatter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.rawMarkdownBody.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === null ||
        post.frontmatter.categories?.includes(selectedCategory) ||
        post.frontmatter.tags?.includes(selectedCategory)
      
      return matchesSearch && matchesCategory
    })
  }, [allPosts, searchTerm, selectedCategory])

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">{part}</mark> : 
        part
    )
  }

  return (
    <Layout>
      <div className="space-y-section">
        <div className="mb-component">
          <h1 className="text-display-md font-bold text-foreground mb-component font-serif">Blog</h1>
          
          {/* Search and Filter Controls */}
          <div className="bg-card p-component rounded-lg border shadow-sm mb-component">
            <div className="space-y-element">
              {/* Search Input */}
              <div className="relative">
                <label htmlFor="blog-search" className="sr-only">
                  Search blog posts by title, content, or tags
                </label>
                <input
                  id="blog-search"
                  type="search"
                  placeholder="Search posts by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label="Search blog posts"
                  aria-describedby="search-results-count"
                  role="searchbox"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2 text-foreground/50 hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filters */}
              {allCategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-body-sm font-medium text-foreground/80">Filter by category:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 rounded-full text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        selectedCategory === null
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                      aria-pressed={selectedCategory === null}
                      aria-describedby="category-filter-help"
                    >
                      All ({allPosts.length})
                    </button>
                    {allCategories.map(category => {
                      const count = allPosts.filter(post => 
                        post.frontmatter.categories?.includes(category) ||
                        post.frontmatter.tags?.includes(category)
                      ).length
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1 rounded-full text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            selectedCategory === category
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                          aria-pressed={selectedCategory === category}
                          aria-describedby="category-filter-help"
                        >
                          {category} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Results Count */}
              <p 
                id="search-results-count"
                className="text-body-sm text-foreground/70"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {searchTerm || selectedCategory ? (
                  <>Showing {filteredPosts.length} of {allPosts.length} posts</>
                ) : (
                  <>{allPosts.length} posts total</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="space-y-component">
          {filteredPosts.length === 0 ? (
            <div className="bg-card p-component rounded-lg border shadow-sm text-center">
              <p className="text-body-md text-foreground/70">
                {searchTerm || selectedCategory ? 
                  'No posts found matching your search criteria.' :
                  'No blog posts available.'
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory(null)
                  }}
                  className="mt-2 text-primary hover:text-primary/80 transition-colors text-body-sm font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredPosts.map(node => (
              <article key={node.id} className="bg-card p-component rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-element-sm">
                  <Link
                    to={`/blog/${node.frontmatter.slug}`}
                    className="group block"
                  >
                    <h2 className="text-heading-lg font-semibold text-primary group-hover:text-primary/80 transition-colors font-serif">
                      {highlightSearchTerm(node.frontmatter.title, searchTerm)}
                    </h2>
                  </Link>
                  
                  <div className="flex items-center gap-4 text-body-sm text-foreground/70 font-medium">
                    <time className="drop-shadow-sm">{node.frontmatter.date}</time>
                    <span className="drop-shadow-sm">{node.timeToRead} min read</span>
                  </div>
                  
                  {/* Categories/Tags */}
                  {(node.frontmatter.categories || node.frontmatter.tags) && (
                    <div className="flex flex-wrap gap-2">
                      {node.frontmatter.categories?.map(category => (
                        <span
                          key={category}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {category}
                        </span>
                      ))}
                      {node.frontmatter.tags?.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-body-md text-foreground/70 drop-shadow-sm leading-relaxed">
                    {highlightSearchTerm(node.excerpt, searchTerm)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}

export const Head: HeadFC = () => <SEO title="Blog" description="Technical articles and insights about web development, programming, and technology" />

export default BlogPage
