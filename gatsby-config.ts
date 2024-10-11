import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Ryan Lindsey - Personal Website`,
    description: `testing out gatsby for a personal site/blog`,
    author: `Ryan Lindsey`,
  },
  pathPrefix: "/gatsby-demo",
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `blog`,
        path: `${__dirname}/content/blog`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [],
      },
    },
    `gatsby-plugin-typescript`,
  ],
}

export default config