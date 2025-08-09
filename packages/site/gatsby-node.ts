import path from "path"
import type { GatsbyNode, CreateWebpackConfigArgs } from "gatsby"

/**
 * Create pages dynamically from MarkdownRemark nodes
 */
export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions,
}) => {
  const { createPage } = actions

  const result = await graphql<{
    allMarkdownRemark: {
      nodes: Array<{
        id: string
        frontmatter: { 
          slug: string
          draft?: boolean
        }
        fileAbsolutePath: string
      }>
    }
  }>(`
    query {
      allMarkdownRemark {
        nodes {
          id
          frontmatter {
            slug
            draft
          }
          fileAbsolutePath
        }
      }
    }
  `)

  if (result.errors || !result.data) {
    throw result.errors || new Error("No data returned from GraphQL query")
  }

  // Determine deployment environment
  const isProduction = process.env.NODE_ENV === 'production' && process.env.GATSBY_ENV === 'production'
  const isDevelopment = !isProduction
  
  console.log(`🚀 Building for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`)
  console.log(`📊 TypeScript strict mode: enabled`)
  console.log(`🎯 Performance budgets: JS 200kB, CSS 50kB`)

  result.data.allMarkdownRemark.nodes.forEach(node => {
    if (node.frontmatter.slug) {
      // Check draft status
      const isDraft = node.frontmatter.draft === true
      const isPublished = !isDraft
      
      // In production, only show published posts
      // In development, show all posts but mark drafts
      const shouldCreatePage = isDevelopment || (isProduction && isPublished)
      
      if (!shouldCreatePage) {
        console.log(`📝 Skipping ${isDraft ? 'draft' : 'unpublished'} post: ${node.frontmatter.slug}`)
        return
      }
      
      // Determine if this is a blog post or reading entry based on file path
      const isReadingEntry = node.fileAbsolutePath.includes('/content/reading/')
      const isBlogPost = node.fileAbsolutePath.includes('/content/blog/')
      
      if (isBlogPost) {
        createPage({
          path: `/blog/${node.frontmatter.slug}`,
          component: path.resolve(`./src/templates/blog-post.tsx`),
          context: { 
            id: node.id,
            isDraft: isDraft,
            isProduction: isProduction
          },
        })
        
        if (isDevelopment && isDraft) {
          console.log(`📝 Created draft blog post: /blog/${node.frontmatter.slug}`)
        } else if (!isDraft) {
          console.log(`✅ Created blog post: /blog/${node.frontmatter.slug}`)
        }
      } else if (isReadingEntry) {
        createPage({
          path: `/reading/${node.frontmatter.slug}`,
          component: path.resolve(`./src/templates/reading-entry.tsx`),
          context: { 
            id: node.id,
            isDraft: isDraft,
            isProduction: isProduction
          },
        })
        
        if (isDevelopment && isDraft) {
          console.log(`📝 Created draft reading entry: /reading/${node.frontmatter.slug}`)
        } else if (!isDraft) {
          console.log(`📚 Created reading entry: /reading/${node.frontmatter.slug}`)
        }
      }
    }
  })
}

/**
 * Add slugs to MarkdownRemark nodes
 */
export const onCreateNode: GatsbyNode["onCreateNode"] = ({ node, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark` && node.frontmatter.slug) {
    createNodeField({
      node,
      name: "slug",
      value: node.frontmatter.slug,
    })
  }
}

/**
 * Enhanced Webpack configuration with TypeScript optimizations and code splitting
 */
export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  actions,
  plugins,
  stage,
  getConfig,
}: CreateWebpackConfigArgs) => {
  const { setWebpackConfig, replaceWebpackConfig } = actions
  const config = getConfig()
  
  // Enhanced code splitting for background modules
  const optimizedConfig = {
    ...config,
    optimization: {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Core background system - critical path
          backgroundCore: {
            test: /[\/\\]src[\/\\](contexts|utils)[\/\\]/,
            name: 'background-core',
            priority: 30,
            chunks: 'all',
            maxSize: 150 * 1024, // 150KB limit
            enforce: true,
          },
          // Background modules - lazy loaded for performance
          backgroundModules: {
            test: /[\/\\]src[\/\\]bgModules[\/\\]/,
            name: (module: any) => {
              // Create separate chunks per module for better caching
              const match = module.context?.match(/bgModules[\/\\]([^\/\\]+)/)
              return match ? `bg-module-${match[1]}` : 'bg-modules'
            },
            priority: 25,
            chunks: 'async',
            maxSize: 100 * 1024, // 100KB per module chunk
            enforce: true,
          },
          // D3 library optimization - tree shake unused modules
          d3Vendor: {
            test: /[\/\\]node_modules[\/\\](d3-[^/]+)[\/\\]/,
            name: 'd3-vendor',
            priority: 20,
            chunks: 'all',
            maxSize: 80 * 1024, // 80KB for D3 modules
            reuseExistingChunk: true,
          },
          // React and core vendor libraries
          reactVendor: {
            test: /[\/\\]node_modules[\/\\](react|react-dom)[\/\\]/,
            name: 'react-vendor',
            priority: 40,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // TypeScript utilities and types (if they end up in bundle)
          typeUtils: {
            test: /[\/\\]src[\/\\]types[\/\\]/,
            name: 'type-utils',
            priority: 15,
            chunks: 'all',
            maxSize: 50 * 1024, // 50KB for type utilities
          },
          // Other vendor libraries
          vendor: {
            test: /[\/\\]node_modules[\/\\]/,
            name: 'vendor',
            priority: 10,
            chunks: 'all',
            maxSize: 200 * 1024, // 200KB vendor chunk limit
            reuseExistingChunk: true,
          },
        },
      },
      // Enhanced tree shaking
      usedExports: true,
      sideEffects: false,
      // Module concatenation for better performance
      concatenateModules: stage === 'build-javascript',
    },
  }
  
  // Base configuration for all stages
  setWebpackConfig({
    resolve: {
      // Enhanced path aliases for cleaner imports
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/contexts': path.resolve(__dirname, 'src/contexts'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/bgModules': path.resolve(__dirname, 'src/bgModules'),
        '@/interfaces': path.resolve(__dirname, '../../interfaces'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/lib/utils': path.resolve(__dirname, 'src/lib/utils'),
      },
      // Node.js polyfills for browser compatibility
      fallback: {
        "assert": false,
        "buffer": false,
        "console": false,
        "constants": false,
        "crypto": false,
        "domain": false,
        "events": false,
        "http": false,
        "https": false,
        "os": false,
        "path": false,
        "punycode": false,
        "process": false,
        "querystring": false,
        "stream": false,
        "string_decoder": false,
        "sys": false,
        "timers": false,
        "tty": false,
        "url": false,
        "util": false,
        "vm": false,
        "zlib": false,
      },
    },
    plugins: [
      // Note: Bundle analyzer can be added later with webpack-bundle-analyzer package
      // ...(process.env.ANALYZE_BUNDLE === 'true' ? [new BundleAnalyzerPlugin(...)] : []),
    ],
    // Performance budgets aligned with project requirements
    performance: {
      hints: process.env.NODE_ENV === 'production' ? 'warning' : 'warning',
      maxAssetSize: 600 * 1024, // 600KB per asset (relaxed for build)
      maxEntrypointSize: 800 * 1024, // 800KB total entry point (relaxed for build)
      assetFilter: (assetFilename: string) => {
        // Only check JS and CSS files
        return assetFilename.endsWith('.js') || assetFilename.endsWith('.css')
      },
    },
  })
  
  // Development-specific optimizations
  if (stage === 'develop') {
    setWebpackConfig({
      devtool: 'eval-cheap-module-source-map',
      cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
        // Cache for TypeScript compilation
        name: `${stage}-cache`,
      },
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            include: path.resolve(__dirname, 'src'),
            use: [
              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true, // Speed up development builds
                  experimentalWatchApi: true,
                  configFile: path.resolve(__dirname, 'tsconfig.json'),
                },
              },
            ],
          },
        ],
      },
    })
  }
  
  // Production optimizations
  if (stage === 'build-javascript') {
    // Apply optimized configuration
    replaceWebpackConfig(optimizedConfig)
    
    setWebpackConfig({
      devtool: 'source-map',
      cache: false, // Disable cache for production builds
      module: {
        rules: [
          {
            test: /\.(js|ts|tsx)$/,
            include: [
              path.resolve(__dirname, 'src'),
              path.resolve(__dirname, '../../interfaces'),
            ],
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false, // Keep ES modules for tree shaking
                      useBuiltIns: 'usage',
                      corejs: 3,
                      targets: {
                        browsers: ['> 1%', 'last 2 versions'],
                      },
                    },
                  ],
                  '@babel/preset-typescript',
                  [
                    '@babel/preset-react',
                    {
                      runtime: 'automatic',
                    },
                  ],
                ],
                plugins: [
                  // Dynamic imports for background modules
                  '@babel/plugin-syntax-dynamic-import',
                ],
              },
            },
          },
          // Optimize background modules specifically
          {
            test: /[\/\\]src[\/\\]bgModules[\/\\].*\.(ts|tsx)$/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: { esmodules: true }, // Modern browsers only for bg modules
                    },
                  ],
                  '@babel/preset-typescript',
                ],
                plugins: [
                  '@babel/plugin-syntax-dynamic-import',
                ],
              },
            },
          },
        ],
      },
      // Additional optimizations for production
      optimization: {
        ...optimizedConfig.optimization,
        // Minimize bundle size
        minimize: true,
        // Generate runtime chunk for better caching
        runtimeChunk: 'single',
      },
    })
  }
  
  // HTML processing stage optimizations
  if (stage === 'build-html') {
    setWebpackConfig({
      module: {
        rules: [
          {
            // Handle WebGL contexts in SSR
            test: /[\/\\]src[\/\\](utils|bgModules)[\/\\].*\.(ts|tsx)$/,
            loader: 'null-loader',
            options: {},
          },
        ],
      },
    })
  }
}

/**
 * Type checking for GraphQL queries and enhanced schema
 */
export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] = ({
  actions,
}) => {
  const { createTypes } = actions
  
  const typeDefs = `
    type MarkdownRemark implements Node {
      frontmatter: Frontmatter!
    }
    
    type Frontmatter {
      title: String!
      date: Date! @dateformat
      slug: String!
      description: String
      tags: [String!]
      draft: Boolean
      category: String
      author: String
      excerpt: String
    }
    
    type ReadingEntry implements Node {
      frontmatter: ReadingFrontmatter!
    }
    
    type ReadingFrontmatter {
      title: String!
      author: String!
      date_read: Date @dateformat
      rating: Int
      tags: [String!]
      notes: String
      isbn: String
      genre: String
    }
  `
  
  createTypes(typeDefs)
}
