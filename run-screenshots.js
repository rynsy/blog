const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotDir = '/home/ryan/code/lab/projects/personal_site/screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log('Created screenshots directory');
}

// Change to tests directory and run the test
process.chdir('/home/ryan/code/lab/projects/personal_site/packages/tests');

try {
  console.log('Running Playwright screenshot tests...');
  const output = execSync('npx playwright test e2e/design-assessment.spec.ts --reporter=line --workers=1', { 
    encoding: 'utf-8', 
    stdio: 'pipe' 
  });
  console.log(output);
  console.log('Screenshots captured successfully!');
} catch (error) {
  console.error('Error running tests:', error.stdout || error.message);
  
  // Still try to show what screenshots were created
  if (fs.existsSync(screenshotDir)) {
    const files = fs.readdirSync(screenshotDir);
    console.log('Screenshots directory contents:', files);
  }
}