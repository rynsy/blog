import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"

const projects = [
  {
    name: "Project 1",
    description: "Description of Project 1",
    technologies: ["React", "Node.js", "MongoDB"],
    outcome: "Reduced load times by 50%",
    github: "https://github.com/yourusername/project1",
    demo: "https://project1-demo.com",
  },
  // Add more projects here
]

const PortfolioPage = () => (
  <Layout>
    <SEO title="Portfolio" />
    <div className="space-y-section">
      <h1 className="text-display-md font-bold text-foreground mb-component">Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-component">
        {projects.map((project, index) => (
          <div key={index} className="bg-card p-component rounded-lg border shadow-sm">
            <h2 className="text-heading-lg font-semibold text-foreground mb-element">{project.name}</h2>
            <p className="text-body-md text-muted-foreground mb-element">{project.description}</p>
            <p className="text-body-sm text-muted-foreground mb-element">
              <span className="font-medium text-foreground">Technologies:</span> {project.technologies.join(", ")}
            </p>
            <p className="text-body-sm text-muted-foreground mb-element">
              <span className="font-medium text-foreground">Outcome:</span> {project.outcome}
            </p>
            <div className="flex gap-element">
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors text-body-md font-medium"
              >
                GitHub →
              </a>
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors text-body-md font-medium"
              >
                Live Demo →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Layout>
)

export default PortfolioPage
