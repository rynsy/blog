import React from "react"
import { Link } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <h1>Your Name</h1>
    <p>Backend Engineer with a passion for scalable systems</p>
    <nav>
      <Link to="/about">About</Link>
      <Link to="/portfolio">Portfolio</Link>
      <Link to="/blog">Blog</Link>
    </nav>
    <Link to="/portfolio">
      <button>View Portfolio</button>
    </Link>
  </Layout>
)

export default IndexPage