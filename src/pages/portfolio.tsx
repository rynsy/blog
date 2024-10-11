import React from "react"
import Layout from '../components/layout';
import SEO from '../components/seo';

const projects = [
  {
    name: "Project 1",
    description: "Description of Project 1",
    technologies: ["React", "Node.js", "MongoDB"],
    outcome: "Reduced load times by 50%",
    github: "https://github.com/yourusername/project1",
    demo: "https://project1-demo.com"
  },
  // Add more projects here
]

const PortfolioPage = () => (
  <Layout>
    <SEO title="Portfolio" />
    <h1>Portfolio</h1>
    <div className="project-grid">
      {projects.map((project, index) => (
        <div key={index} className="project-card">
          <h2>{project.name}</h2>
          <p>{project.description}</p>
          <p>Technologies: {project.technologies.join(", ")}</p>
          <p>Outcome: {project.outcome}</p>
          <a href={project.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={project.demo} target="_blank" rel="noopener noreferrer">Live Demo</a>
        </div>
      ))}
    </div>
  </Layout>
)

export default PortfolioPage