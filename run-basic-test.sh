#!/bin/bash

# Simple script to run basic test and see what's happening

set -e

cd /home/ryan/code/lab/projects/personal_site

echo "🔧 Building site first..."
pnpm build

echo "🐳 Starting production site container..."
COMPOSE_PROFILES=testing docker-compose -f docker/docker-compose.production-test.yml up --build -d production-site analytics-mock

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Check if site is up
echo "🌐 Testing if site is accessible..."
curl -f http://localhost:8080 || echo "Site not accessible yet, continuing..."

echo "🧪 Running basic health check test..."
COMPOSE_PROFILES=testing docker-compose -f docker/docker-compose.production-test.yml run --rm e2e-tests npx playwright test basic-health-check.spec.ts --reporter=line --timeout=60000

echo "🧹 Cleaning up..."
docker-compose -f docker/docker-compose.production-test.yml down

echo "✅ Basic test completed!"