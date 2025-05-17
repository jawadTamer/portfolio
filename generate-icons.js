const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_IMAGE = './src/assets/images/profile/profile.png';
const OUTPUT_DIR = './src/assets/icons';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate icons
async function generateIcons() {
  try {
    // Generate each icon size
    for (const size of ICON_SIZES) {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(path.join(OUTPUT_DIR, `icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }

    // Generate favicon sizes
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));

    await sharp(SOURCE_IMAGE)
      .resize(16, 16, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));

    // Generate apple touch icon
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons(); 