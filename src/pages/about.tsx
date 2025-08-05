import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"

const AboutPage = () => (
  <Layout>
    <SEO title="About" />
    <div className="prose prose-lg max-w-none">
      <h1 className="text-display-md font-bold text-foreground mb-component">About Me</h1>
      <p className="text-body-lg text-muted-foreground mb-section-sm">Professional bio goes here...</p>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Experience</h2>
      <div className="bg-card p-component rounded-lg border mb-component">
        <p className="text-muted-foreground">Add your experience details</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Skills</h2>
      <div className="bg-card p-component rounded-lg border mb-component">
        <p className="text-muted-foreground">Add your skills</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Achievements</h2>
      <div className="bg-card p-component rounded-lg border mb-component">
        <p className="text-muted-foreground">Add your achievements</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Contact</h2>
      <div className="bg-card p-component rounded-lg border">
        <p className="text-muted-foreground">Add your contact information</p>
      </div>
    </div>
  </Layout>
)

export default AboutPage
