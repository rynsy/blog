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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project, index) => (
        <div key={index} className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
          <p className="mb-2">{project.description}</p>
          <p className="mb-2">Technologies: {project.technologies.join(", ")}</p>
          <p className="mb-4">Outcome: {project.outcome}</p>
          <div className="flex space-x-4">
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">GitHub</a>
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Live Demo</a>
          </div>
        </div>
      ))}
    </div>
  </Layout>
)

export default PortfolioPage