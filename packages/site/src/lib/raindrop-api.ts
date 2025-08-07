// Raindrop.io API integration
// API Docs: https://developer.raindrop.io/

export interface RaindropBookmark {
  _id: number
  title: string
  excerpt: string
  note: string
  type: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio'
  cover: string
  tags: string[]
  created: string
  lastUpdate: string
  link: string
  domain: string
  creatorRef: {
    name: string
    email: string
  }
  collection: {
    $id: number
    title: string
  }
  cache?: {
    status: 'ready' | 'retry' | 'failed'
    size: number
    created: string
  }
}

export interface RaindropCollection {
  _id: number
  title: string
  description: string
  cover: string[]
  count: number
  created: string
  lastUpdate: string
  public: boolean
  sort: number
  expanded: boolean
  creatorRef: number
}

export interface BookmarkFilters {
  tags?: string[]
  collection?: number
  type?: string
  search?: string
  sort?: 'created' | '-created' | 'title' | '-title' | 'domain'
  page?: number
  perpage?: number
}

class RaindropAPI {
  private baseUrl = 'https://api.raindrop.io/rest/v1'
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get bookmarks from a collection (0 = all bookmarks)
  async getBookmarks(filters: BookmarkFilters = {}): Promise<{
    items: RaindropBookmark[]
    count: number
    collectionId: number
  }> {
    const {
      collection = 0,
      tags = [],
      type,
      search,
      sort = '-created',
      page = 0,
      perpage = 25
    } = filters

    let endpoint = `/raindrops/${collection}`
    const params = new URLSearchParams()

    if (tags.length > 0) {
      params.append('tags', tags.join(','))
    }
    if (type) {
      params.append('type', type)
    }
    if (search) {
      params.append('search', search)
    }
    if (sort) {
      params.append('sort', sort)
    }
    if (page > 0) {
      params.append('page', page.toString())
    }
    if (perpage !== 25) {
      params.append('perpage', perpage.toString())
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    return this.request(endpoint)
  }

  // Get all collections
  async getCollections(): Promise<{ items: RaindropCollection[] }> {
    return this.request('/collections')
  }

  // Get tags
  async getTags(): Promise<{ items: Array<{ _id: string, count: number }> }> {
    return this.request('/tags')
  }

  // Get recent bookmarks (last 30 days)
  async getRecentBookmarks(limit: number = 5): Promise<RaindropBookmark[]> {
    const result = await this.getBookmarks({
      sort: '-created',
      perpage: limit
    })
    return result.items
  }
}

// Export singleton instance (will be initialized with token from env)
export const raindropApi = new RaindropAPI(process.env.GATSBY_RAINDROP_TOKEN || '')

// Utility functions
export const formatBookmarkDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const getBookmarkType = (bookmark: RaindropBookmark): string => {
  if (bookmark.domain.includes('github.com')) return 'repo'
  if (bookmark.domain.includes('arxiv.org')) return 'paper'
  if (bookmark.domain.includes('youtube.com') || bookmark.type === 'video') return 'video'
  if (bookmark.type === 'article') return 'article'
  return 'link'
}

export const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    article: '📄',
    paper: '📑',
    repo: '💻',
    video: '🎥',
    tool: '🔧',
    link: '🔗'
  }
  return icons[type] || '🔗'
}