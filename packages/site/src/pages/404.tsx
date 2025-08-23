import Layout from "../components/layout"
import SEO from "../components/seo"

import * as React from "react"
import { Link, HeadFC } from "gatsby"

const NotFoundPage = () => {
  return (
    <Layout>
      <main style={styles.main}>
        <div style={styles.container}>
          <h1 style={styles.heading}>404</h1>
          <p style={styles.text}>
            Oops! The page you’re looking for doesn’t exist.
          </p>
          <Link to="/" style={styles.link}>
            Go Back Home
          </Link>
        </div>
      </main>
    </Layout>
  )
}

const styles = {
  main: {
    fontFamily: "'Helvetica', 'Arial', sans-serif",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    color: "#333",
  },
  container: {
    textAlign: "center",
  },
  heading: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.5rem",
    marginBottom: "2rem",
  },
  link: {
    fontSize: "1.2rem",
    color: "#007acc",
    textDecoration: "none",
    fontWeight: "bold",
  },
}

export const Head: HeadFC = () => <SEO title="Page Not Found" description="The page you're looking for doesn't exist" />

export default NotFoundPage
