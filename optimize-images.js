// Image Optimization Script
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// Directories to process
const IMAGE_DIRS = [
  'src/assets/images/profile',
  'src/assets/images/projects'
];

// Image formats to process
const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif'];

// Responsive image sizes
const RESPONSIVE_SIZES = [300, 600, 900, 1200];

// Quality settings for different formats
const QUALITY_SETTINGS = {
  webp: {
    quality: 80,
    effort: 6,
    lossless: false
  },
  avif: {
    quality: 75,
    effort: 6,
    lossless: false
  },
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  }
};

// Size configurations with aspect ratio preservation
const SIZE_CONFIGS = {
  'projects': {
    width: 400,
    height: 225,
    fit: 'cover',
    position: 'attention'
  },
  'profile': {
    width: 300,
    height: 300,
    fit: 'cover',
    position: 'attention'
  },
  'default': {
    width: 800,
    fit: 'inside',
    withoutEnlargement: true
  }
};

// Create target directory if it doesn't exist
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Get image metadata
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return metadata;
  } catch (error) {
    console.error(`Error getting metadata for ${imagePath}:`, error);
    return null;
  }
}

// Process a single image
async function processImage(imagePath) {
  try {
    const dir = path.dirname(imagePath);
    const filename = path.basename(imagePath, path.extname(imagePath));
    const metadata = await getImageMetadata(imagePath);
    
    if (!metadata) {
      throw new Error('Failed to get image metadata');
    }

    // Create output directories
    const webpDir = path.join(dir, 'webp');
    const avifDir = path.join(dir, 'avif');
    ensureDirExists(webpDir);
    ensureDirExists(avifDir);
    
    // Determine size configuration based on directory name
    const dirName = path.basename(dir);
    const config = SIZE_CONFIGS[dirName] || SIZE_CONFIGS.default;
    
    // Process original size in both WebP and AVIF
    const webpPath = path.join(webpDir, `${filename}.webp`);
    const avifPath = path.join(avifDir, `${filename}.avif`);
    
    await Promise.all([
      processImageSize(imagePath, webpPath, config, 'webp'),
      processImageSize(imagePath, avifPath, config, 'avif')
    ]);
    
    // Process responsive sizes
    const responsivePromises = RESPONSIVE_SIZES.flatMap(size => [
      processImageSize(
        imagePath,
        path.join(webpDir, `${filename}-${size}.webp`),
        { ...config, width: size },
        'webp'
      ),
      processImageSize(
        imagePath,
        path.join(avifDir, `${filename}-${size}.avif`),
        { ...config, width: size },
        'avif'
      )
    ]);
    
    await Promise.all(responsivePromises);
    
    console.log(`Successfully processed ${imagePath} with responsive sizes`);
    return true;
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
    return false;
  }
}

// Process image with specific size and format
async function processImageSize(inputPath, outputPath, config, format) {
  try {
    // Skip if output already exists and is newer than input
    if (fs.existsSync(outputPath)) {
      const inputStat = fs.statSync(inputPath);
      const outputStat = fs.statSync(outputPath);
      if (outputStat.mtime > inputStat.mtime) {
        console.log(`Skipping ${outputPath} (already processed)`);
        return;
      }
    }
    
    console.log(`Processing ${outputPath}...`);
    
    // Start with base image processing
    let sharpInstance = sharp(inputPath)
      .rotate() // Auto-rotate based on EXIF
      .strip() // Remove metadata
      .withMetadata(); // Keep essential metadata
    
    // Apply resize if needed
    if (config.width || config.height) {
      sharpInstance = sharpInstance.resize(config.width, config.height, {
        fit: config.fit || 'inside',
        position: config.position || 'center',
        withoutEnlargement: config.withoutEnlargement ?? true
      });
    }
    
    // Apply format-specific processing
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp(QUALITY_SETTINGS.webp);
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif(QUALITY_SETTINGS.avif);
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg(QUALITY_SETTINGS.jpeg);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    // Save the processed image
    await sharpInstance.toFile(outputPath);
    console.log(`Created ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${outputPath}:`, error);
    return false;
  }
}

// Main function with progress tracking
async function optimizeImages() {
  console.log('Starting image optimization...');
  let processed = 0;
  let failed = 0;
  let total = 0;
  
  for (const dir of IMAGE_DIRS) {
    console.log(`Processing directory: ${dir}`);
    
    for (const format of IMAGE_FORMATS) {
      const pattern = path.join(dir, `*.${format}`);
      const files = glob.sync(pattern);
      total += files.length;
      
      console.log(`Found ${files.length} ${format} files in ${dir}`);
      
      for (const file of files) {
        const success = await processImage(file);
        if (success) {
          processed++;
        } else {
          failed++;
        }
        
        // Log progress
        console.log(`Progress: ${processed + failed}/${total} (${Math.round((processed + failed) / total * 100)}%)`);
      }
    }
  }
  
  console.log('\nImage optimization complete!');
  console.log(`Successfully processed: ${processed} images`);
  console.log(`Failed to process: ${failed} images`);
  console.log(`Total images: ${total}`);
}

// Run the optimization with error handling
optimizeImages().catch(error => {
  console.error('Fatal error during optimization:', error);
  process.exit(1);
}); 