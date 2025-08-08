const fs = require('fs');
const path = require('path');

const screenshotDir = '/home/ryan/code/lab/projects/personal_site/screenshots';

// Create the directory
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log('Created screenshots directory at:', screenshotDir);
} else {
  console.log('Screenshots directory already exists');
  
  // List any existing files
  const files = fs.readdirSync(screenshotDir);
  if (files.length > 0) {
    console.log('Existing files:');
    files.forEach(file => console.log(' -', file));
  } else {
    console.log('Directory is empty');
  }
}

// Test file creation
const testFile = path.join(screenshotDir, 'test.txt');
fs.writeFileSync(testFile, 'test');
console.log('Test file created successfully');
fs.unlinkSync(testFile);
console.log('Test file deleted - directory is writable');