const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const FONTS_DIR = path.join(__dirname, '../src/assets/fonts');
const FONTS = {
  'roboto-v30-latin-regular.woff2': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
  'roboto-v30-latin-500.woff2': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2',
  'roboto-v30-latin-700.woff2': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2'
};

async function downloadFont(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function setupFonts() {
  try {
    // Create fonts directory if it doesn't exist
    await mkdir(FONTS_DIR, { recursive: true });

    // Download each font
    for (const [filename, url] of Object.entries(FONTS)) {
      console.log(`Downloading ${filename}...`);
      const fontData = await downloadFont(url, filename);
      await writeFile(path.join(FONTS_DIR, filename), fontData);
      console.log(`Downloaded ${filename}`);
    }

    // Create a CSS file to define the font faces
    const fontFaceCSS = `
/* Roboto Font Family */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./roboto-v30-latin-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./roboto-v30-latin-500.woff2') format('woff2');
}

@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./roboto-v30-latin-700.woff2') format('woff2');
}
`;

    await writeFile(path.join(FONTS_DIR, 'fonts.css'), fontFaceCSS);
    console.log('Created fonts.css');

    console.log('Font setup complete!');
  } catch (error) {
    console.error('Error setting up fonts:', error);
    process.exit(1);
  }
}

setupFonts(); 