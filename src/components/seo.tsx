import React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface SEOProps {
  description?: string
  lang?: string
  meta?: Array<{
    name?: string
    property?: string
    content: string
  }>
  title: string
}

function SEO({ description = '', lang = 'en', meta = [], title }: SEOProps) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description

  return (
    <>
      <html lang={lang} />
      <title>{title} | {site.siteMetadata.title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={site.siteMetadata.author} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {meta.map((metaItem, index) => (
        metaItem.name ? (
          <meta key={index} name={metaItem.name} content={metaItem.content} />
        ) : (
          <meta key={index} property={metaItem.property} content={metaItem.content} />
        )
      ))}
    </>
  )
}

export default SEO
