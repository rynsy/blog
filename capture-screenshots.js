const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:9000';
const SCREENSHOT_DIR = '/home/ryan/code/lab/projects/personal_site/screenshots';

async function captureScreenshots() {
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log('Created screenshots directory');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Capturing desktop homepage...');
    
    // Desktop homepage
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'homepage-desktop.png'),
      fullPage: true
    });
    console.log('✓ Desktop homepage captured');

    // Mobile homepage
    console.log('Capturing mobile homepage...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'homepage-mobile.png'),
      fullPage: true
    });
    console.log('✓ Mobile homepage captured');

    // Reset to desktop for other pages
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Try blog page
    console.log('Looking for blog page...');
    const blogUrls = [
      `${BASE_URL}/blog`,
      `${BASE_URL}/blog/`,
      `${BASE_URL}/posts`,
      `${BASE_URL}/articles`
    ];

    let blogFound = false;
    for (const url of blogUrls) {
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        if (response && response.status() === 200) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'blog-page.png'),
            fullPage: true
          });
          console.log(`✓ Blog page captured from: ${url}`);
          blogFound = true;
          break;
        }
      } catch (e) {
        console.log(`Blog URL ${url} not accessible`);
      }
    }

    if (!blogFound) {
      // Check homepage for blog links
      await page.goto(BASE_URL, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      const blogLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(link => {
            const text = link.textContent?.toLowerCase() || '';
            const href = link.getAttribute('href') || '';
            return text.includes('blog') || text.includes('post') || text.includes('article') ||
                   href.includes('blog') || href.includes('post') || href.includes('article');
          })
          .map(link => link.getAttribute('href'))
          .filter(href => href !== null);
      });

      if (blogLinks.length > 0) {
        const blogLink = blogLinks[0];
        const fullUrl = blogLink.startsWith('http') ? blogLink : `${BASE_URL}${blogLink}`;
        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'blog-page.png'),
            fullPage: true
          });
          console.log(`✓ Blog page captured via homepage link: ${fullUrl}`);
          blogFound = true;
        } catch (e) {
          console.log('Blog link not accessible');
        }
      }
    }

    if (!blogFound) {
      console.log('- Blog page not found');
    }

    // Try about page
    console.log('Looking for about page...');
    const aboutUrls = [
      `${BASE_URL}/about`,
      `${BASE_URL}/about/`,
      `${BASE_URL}/about-me`,
      `${BASE_URL}/bio`
    ];

    let aboutFound = false;
    for (const url of aboutUrls) {
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        if (response && response.status() === 200) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'about-page.png'),
            fullPage: true
          });
          console.log(`✓ About page captured from: ${url}`);
          aboutFound = true;
          break;
        }
      } catch (e) {
        console.log(`About URL ${url} not accessible`);
      }
    }

    if (!aboutFound) {
      // Check homepage for about links
      await page.goto(BASE_URL, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      const aboutLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(link => {
            const text = link.textContent?.toLowerCase() || '';
            const href = link.getAttribute('href') || '';
            return text.includes('about') || text.includes('bio') || text.includes('profile') ||
                   href.includes('about') || href.includes('bio') || href.includes('profile');
          })
          .map(link => link.getAttribute('href'))
          .filter(href => href !== null);
      });

      if (aboutLinks.length > 0) {
        const aboutLink = aboutLinks[0];
        const fullUrl = aboutLink.startsWith('http') ? aboutLink : `${BASE_URL}${aboutLink}`;
        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'about-page.png'),
            fullPage: true
          });
          console.log(`✓ About page captured via homepage link: ${fullUrl}`);
          aboutFound = true;
        } catch (e) {
          console.log('About link not accessible');
        }
      }
    }

    if (!aboutFound) {
      console.log('- About page not found');
    }

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }

  // List captured screenshots
  console.log('\n=== Screenshot Summary ===');
  const files = fs.readdirSync(SCREENSHOT_DIR);
  files.forEach(file => {
    const filePath = path.join(SCREENSHOT_DIR, file);
    const stats = fs.statSync(filePath);
    console.log(`${file}: ${Math.round(stats.size / 1024)}KB`);
  });
  
  return files;
}

captureScreenshots().catch(console.error);