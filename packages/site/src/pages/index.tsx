import React from "react"
import { HeadFC } from "gatsby"
import Layout from "../components/layout"
import { LandingPageComponent } from "../components/landing-page"
import SEO from "../components/seo"

const IndexPage = () => {
  console.log('🏡 Homepage: Rendering IndexPage')
  return (
    <Layout>
      <LandingPageComponent />
    </Layout>
  )
}

export const Head: HeadFC = () => <SEO title="Home" description="Personal site with interactive backgrounds, blog, and portfolio" />

export default IndexPage
