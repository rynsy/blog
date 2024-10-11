# Website Commands and Maintenance Guide

This document outlines the essential commands and processes for running, developing, and maintaining our Gatsby-based website.

## Table of Contents
1. [Setup](#setup)
2. [Development](#development)
3. [Building and Deployment](#building-and-deployment)
4. [Content Management](#content-management)
5. [Styling](#styling)
6. [Troubleshooting](#troubleshooting)

## Setup

### Installing Dependencies
Before you start, make sure you have Node.js and npm installed. Then, run:


```bash
npm install
```

This command installs all the necessary dependencies listed in the `package.json` file.

## Development

### Starting the Development Server
To start the development server and work on the website locally, use:


```bash
npm run develop
```

or


```bash
gatsby develop
```

This will start the development server, typically at `http://localhost:8000`.

### Accessing GraphiQL
GraphiQL, a tool for exploring your site's data and schema, is available at:


```
http://localhost:8000/___graphql
```

## Building and Deployment

### Building the Site
To build the site for production, use:


```bash
npm run build
```

or


```bash
gatsby build
```

This creates a `public` directory with the compiled files.

### Serving the Production Build Locally
To test the production build locally:


```bash
npm run serve
```

or


```bash
gatsby serve
```

This typically serves the site at `http://localhost:9000`.

### Deployment
Our site is set up to deploy automatically to GitHub Pages when changes are pushed to the main branch. The deployment process is defined in the `.github/workflows/deploy.yml` file.

## Content Management

### Creating a New Blog Post
To create a new blog post, you can use the provided script:


```bash
node scripts/new-blog.js "Your Blog Post Title"
```

This script will create a new Markdown file in the `content/blog` directory with the correct filename format and frontmatter.

Alternatively, you can manually follow these steps:

1. Create a new Markdown file in the `content/blog` directory.
2. Name the file with the format `YYYY-MM-DD-title-of-your-post.md`.
3. Add the following frontmatter at the top of the file:


```markdown
---
title: "Your Blog Post Title"
date: "YYYY-MM-DD"
---

Your blog post content goes here...
```

### Adding Custom Styling to a Blog Post
To add custom styling to a specific blog post:

1. In your blog post's Markdown file, you can use HTML and CSS inline:


```html
<div style="color: blue; font-size: 18px;">
  This text will be blue and larger.
</div>
```

2. For more complex styling, you can use CSS modules:
   - Create a file named `[post-name].module.css` in the same directory as your blog post.
   - In your blog post, import and use the styles:


```markdown
import * as styles from './[post-name].module.css'

<div className={styles.customClass}>
  This div will use the custom styling.
</div>
```

3. Remember to keep the global styles in mind, which are defined in `src/components/layout.css`.

### Creating a New Blog Post with Custom CSS
To create a new blog post with a custom CSS file:

```bash
node scripts/new-blog.js "Your Blog Post Title" "custom-post-styles.css"
```

This will create both the Markdown file for your blog post and a custom CSS file in the `src/styles` directory. You can then add your custom styles to this CSS file.

### Using Tailwind CSS
Our site now uses Tailwind CSS for styling. You can use Tailwind classes directly in your Markdown files or components. For example:

```html
<div class="text-blue-500 font-bold">
  This text will be blue and bold.
</div>
```

For more information on using Tailwind CSS, refer to the [official documentation](https://tailwindcss.com/docs).

## Styling

### Global Styles
Global styles are defined in `src/components/layout.css`. To make changes that affect the entire site, edit this file.

### Component-Specific Styles
For component-specific styles, create a CSS module next to the component file. For example, `MyComponent.js` would have a corresponding `MyComponent.module.css` file.

## Troubleshooting

### Clearing Gatsby's Cache
If you encounter unexplained issues, try clearing Gatsby's cache:


```bash
npm run clean
```

or


```bash
gatsby clean
```

### Updating Dependencies
To update all dependencies to their latest versions:


```bash
npm update
```

For major version updates, use:


```bash
npm outdated
```

to see which packages have new major versions, then update them manually in `package.json` and run `npm install`.

### Linting and Formatting
To format your code using Prettier:


```bash
npm run format
```

This command is defined in the `package.json` file.

Remember to commit your changes and push to the main branch to trigger the automatic deployment process.
