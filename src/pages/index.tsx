import React from "react"
import { Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { LandingPageComponent } from "@/components/landing-page"

const IndexPage = () => <LandingPageComponent />

export default IndexPage
//
// <Layout>
//   <SEO title="Home" />
//   <h1 className="text-4xl font-bold mb-4">Ryan Lindsey</h1>
//   <p className="mb-6">Testing out Gatsby for a personal site/blog</p>
//   <nav className="mb-8">
//     <Link to="/about" className="mr-4">About</Link>
//     <Link to="/portfolio" className="mr-4">Portfolio</Link>
//     <Link to="/blog">Blog</Link>
//   </nav>
//   <Link to="/portfolio">
//     <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">View Portfolio</button>
//   </Link>
// </Layout>
