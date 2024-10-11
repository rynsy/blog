const fs = require('fs')
const path = require('path')

const createBlogPost = (title, customCss) => {
  const date = new Date().toISOString().split('T')[0]
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${date}-${slug}.md`
  const filePath = path.join(__dirname, '..', 'content', 'blog', filename)

  const content = `---
title: "${title}"
date: "${date}"
slug: "${slug}"
${customCss ? `customCss: "${customCss}"` : ''}
---

Your blog post content goes here...
`

  fs.writeFileSync(filePath, content)
  console.log(`Blog post created: ${filePath}`)

  if (customCss) {
    const cssPath = path.join(__dirname, '..', 'src', 'styles', customCss)
    fs.writeFileSync(cssPath, '/* Add your custom styles here */')
    console.log(`Custom CSS file created: ${cssPath}`)
  }
}

const [,, title, customCss] = process.argv
if (!title) {
  console.error('Please provide a title for the blog post')
  process.exit(1)
}

createBlogPost(title, customCss)
