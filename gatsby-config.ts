import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Ryan Lindsey - Personal Website`,
    description: `Testing out Gatsby for a personal site/blog`,
    author: `Ryan Lindsey`,
  },
  pathPrefix: "/gatsby-demo",
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-postcss`,
    `gatsby-plugin-typescript`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`, // Path to your Markdown files
      },
    },
    `gatsby-transformer-remark`, // Ensure this plugin is included
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Ryan Lindsey - Personal Website`,
        short_name: `Ryan Lindsey`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
  ],
}

export default config
