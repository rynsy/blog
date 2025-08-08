import type { GatsbyConfig } from "gatsby"

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Ryan Lindsey - Personal Website`,
    description: `Personal website and blog of Ryan Lindsey - Software Engineer`,
    author: `Ryan Lindsey`,
    siteUrl: `https://rynsy.com`,
  },
  pathPrefix: process.env.DEPLOY_TARGET === "github" ? "/blog" : "",
  plugins: [
    `gatsby-plugin-postcss`,
    `gatsby-plugin-typescript`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`, // Path to your Markdown files
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `reading`,
        path: `${__dirname}/content/reading`, // Path to reading entries
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-katex`,
            options: {
              // Add any KaTeX options here
              strict: `ignore`
            }
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: "language-",
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: false,
              noInlineHighlight: false,
              escapeEntities: {},
            }
          }
        ]
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Ryan Lindsey - Personal Website`,
        short_name: `Ryan Lindsey`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // TODO: Replace with custom favicon
      },
    },
  ],
}

export default config
