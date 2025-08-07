import React from "react"
import { HeadFC } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"

const ContactPage = () => (
  <Layout>
    <div className="prose prose-lg max-w-none">
      <h1 className="text-display-md font-bold text-foreground mb-component">Contact Info</h1>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Links</h2>
      <div className="bg-card p-component rounded-lg border mb-component">
        <p className="text-muted-foreground">Add your social links and profiles</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Email</h2>
      <div className="bg-card p-component rounded-lg border">
        <p className="text-muted-foreground">Add your email contact information</p>
      </div>
    </div>
  </Layout>
)

export const Head: HeadFC = () => <SEO title="Contact" />

export default ContactPage
