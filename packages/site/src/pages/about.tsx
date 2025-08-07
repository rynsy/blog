import React from "react"
import { HeadFC } from "gatsby"
import Layout from "../components/layout"
import SEO from "../components/seo"

const AboutPage = () => (
  <Layout>
    <div className="prose prose-lg max-w-none">
      <h1 className="text-display-md font-bold text-foreground mb-component">About Me</h1>
      <p className="text-body-lg text-foreground/70 mb-section-sm drop-shadow-sm">Professional bio goes here...</p>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Experience</h2>
      <div className="bg-white/10 backdrop-blur-sm p-component rounded-lg border border-white/20 mb-component">
        <p className="text-foreground/70 drop-shadow-sm">Add your experience details</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Skills</h2>
      <div className="bg-white/10 backdrop-blur-sm p-component rounded-lg border border-white/20 mb-component">
        <p className="text-foreground/70 drop-shadow-sm">Add your skills</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Achievements</h2>
      <div className="bg-white/10 backdrop-blur-sm p-component rounded-lg border border-white/20 mb-component">
        <p className="text-foreground/70 drop-shadow-sm">Add your achievements</p>
      </div>
      
      <h2 className="text-heading-lg font-semibold text-foreground mb-element mt-section-sm">Contact</h2>
      <div className="bg-white/10 backdrop-blur-sm p-component rounded-lg border border-white/20">
        <p className="text-foreground/70 drop-shadow-sm">Add your contact information</p>
      </div>
    </div>
  </Layout>
)

export const Head: HeadFC = () => <SEO title="About" />

export default AboutPage
