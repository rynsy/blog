const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create screenshots directory first
const screenshotDir = '/home/ryan/code/lab/projects/personal_site/screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log('Created screenshots directory');
}

// Create a minimal Playwright script
const scriptContent = `
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Attempting to connect to http://localhost:9000...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:9000', { timeout: 30000 });
    console.log('Page loaded, taking screenshot...');
    
    await page.screenshot({
      path: '${screenshotDir}/test-homepage.png',
      fullPage: true
    });
    
    console.log('Screenshot saved successfully!');
    
    // Get page title to verify it loaded
    const title = await page.title();
    console.log('Page title:', title);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
`;

fs.writeFileSync('/tmp/test-playwright.js', scriptContent);

// Run the script from the tests directory (which has playwright installed)
try {
  process.chdir('/home/ryan/code/lab/projects/personal_site/packages/tests');
  console.log('Running test screenshot...');
  const output = execSync('node /tmp/test-playwright.js', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error('Error running script:', error.stdout || error.message);
}

// Check if screenshot was created
if (fs.existsSync(path.join(screenshotDir, 'test-homepage.png'))) {
  const stats = fs.statSync(path.join(screenshotDir, 'test-homepage.png'));
  console.log(`Screenshot created: ${Math.round(stats.size / 1024)}KB`);
} else {
  console.log('Screenshot was not created');
}