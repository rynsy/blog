#!/bin/bash

# Quick script to test if the site builds successfully

set -e

cd /home/ryan/code/lab/projects/personal_site

echo "🔧 Installing dependencies..."
pnpm install

echo "🏗️  Testing site build..."
pnpm build

if [ -d "packages/site/public" ] && [ -f "packages/site/public/index.html" ]; then
    echo "✅ Build succeeded! Site built to packages/site/public/"
    echo "📦 Build size:"
    du -sh packages/site/public/
    
    echo "📄 Index.html preview (first 10 lines):"
    head -10 packages/site/public/index.html
else
    echo "❌ Build failed - public directory or index.html not found"
    exit 1
fi

echo "✅ Build test completed successfully!"