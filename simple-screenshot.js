const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Taking desktop screenshot...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:9000', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.screenshot({
      path: '/home/ryan/code/lab/projects/personal_site/screenshots/homepage-desktop.png',
      fullPage: true
    });
    console.log('✓ Desktop screenshot saved');

    console.log('Taking mobile screenshot...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:9000', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.screenshot({
      path: '/home/ryan/code/lab/projects/personal_site/screenshots/homepage-mobile.png',
      fullPage: true
    });
    console.log('✓ Mobile screenshot saved');
    
    // Get page title for assessment
    const title = await page.title();
    console.log('Page title:', title);

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();