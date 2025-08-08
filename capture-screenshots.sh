#!/bin/bash

# Create screenshots directory if it doesn't exist
mkdir -p /home/ryan/code/lab/projects/personal_site/screenshots

# Change to tests directory
cd /home/ryan/code/lab/projects/personal_site/packages/tests

echo "Running design assessment screenshots..."

# Run only the design assessment test
npx playwright test e2e/design-assessment.spec.ts --reporter=line --workers=1