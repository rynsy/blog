#!/bin/bash

# Test the Playwright setup locally (not in Docker)

set -e

cd /home/ryan/code/lab/projects/personal_site

echo "🔧 Installing dependencies..."
pnpm install

echo "🚀 Starting local development server in background..."
cd packages/site
pnpm develop > /tmp/gatsby.log 2>&1 &
GATSBY_PID=$!

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    if [ ! -z "$GATSBY_PID" ]; then
        kill $GATSBY_PID 2>/dev/null || true
    fi
    exit
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

echo "⏳ Waiting for Gatsby to start..."
sleep 30

# Check if Gatsby is running
if curl -f http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ Gatsby is running!"
else
    echo "❌ Gatsby failed to start"
    echo "Last 20 lines of Gatsby log:"
    tail -20 /tmp/gatsby.log
    exit 1
fi

echo "🧪 Running basic health check test..."
npx playwright test basic-health-check.spec.ts --reporter=line

echo "🧪 Running cross-browser compatibility test (Chrome only)..."
npx playwright test cross-browser-compatibility.spec.ts --project=chromium --reporter=line

echo "✅ Local tests completed!"