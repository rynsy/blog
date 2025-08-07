import React from "react"
import Layout from "../components/layout"
import { LandingPageComponent } from "@/components/landing-page"

const IndexPage = () => {
  console.log('🏡 Homepage: Rendering IndexPage')
  return (
    <Layout>
      <LandingPageComponent />
    </Layout>
  )
}

export default IndexPage
