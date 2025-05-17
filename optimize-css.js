const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const { exec } = require('child_process');
const { promisify: promisifyExec } = require('util');
const execAsync = promisifyExec(exec);
const critical = require('critical');

// Configuration
const CONFIG = {
  inputDir: 'src',
  outputDir: 'dist/portfolio',
  criticalCss: true,
  analyze: true,
  generateSourceMaps: true,
  minify: true,
  purge: true,
  inlineCritical: true
};

// Content files to scan for used CSS
const content = [
  `${CONFIG.inputDir}/**/*.html`,
  `${CONFIG.inputDir}/**/*.ts`,
  `${CONFIG.inputDir}/**/*.js`,
  `${CONFIG.inputDir}/**/*.component.html`
];

// CSS files to process
const cssFiles = [
  `${CONFIG.inputDir}/styles.css`,
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/sweetalert2/dist/sweetalert2.min.css'
];

// Safelist for PurgeCSS
const safelist = {
  standard: [
    /^mat-/,
    /^cdk-/,
    /^ng-/,
    /^bs-/,
    /^active$/,
    /^show$/,
    /^collapsed$/,
    /^open$/,
    /^selected$/,
    /^disabled$/,
    /^hidden$/,
    /^visible$/,
    /^fade$/,
    /^in$/,
    /^out$/,
    /^loading$/,
    /^error$/,
    /^success$/,
    /^warning$/,
    /^info$/
  ],
  deep: [/^mat-/, /^cdk-/, /^ng-/, /^bs-/],
  greedy: [/^mat-/, /^cdk-/, /^ng-/, /^bs-/]
};

// Analyze CSS bundle size
async function analyzeBundle(filePath, css) {
  const size = Buffer.byteLength(css, 'utf8');
  const gzippedSize = await execAsync(`echo "${css}" | gzip -c | wc -c`);
  return {
    file: path.basename(filePath),
    size: (size / 1024).toFixed(2),
    gzippedSize: (parseInt(gzippedSize.stdout) / 1024).toFixed(2)
  };
}

// Extract critical CSS
async function extractCriticalCSS(htmlFile, cssFile) {
  try {
    const result = await critical.generate({
      src: htmlFile,
      target: {
        css: cssFile.replace('.css', '.critical.css'),
        html: htmlFile.replace('.html', '.critical.html')
      },
      width: 1300,
      height: 900,
      inline: CONFIG.inlineCritical,
      dimensions: [
        { width: 375, height: 667 }, // iPhone SE
        { width: 768, height: 1024 }, // iPad
        { width: 1920, height: 1080 } // Desktop
      ]
    });
    return result;
  } catch (error) {
    console.error(`Error extracting critical CSS for ${htmlFile}:`, error);
    return null;
  }
}

// Optimize a single CSS file
async function optimizeFile(cssFile) {
  try {
    const css = await readFile(cssFile, 'utf8');
    
    // Analyze original bundle
    const originalAnalysis = await analyzeBundle(cssFile, css);
    
    let optimizedCss = css;
    let criticalCss = null;
    
    // Purge unused CSS if enabled
    if (CONFIG.purge) {
      const purgeResult = await new PurgeCSS().purge({
        content,
        css: [{ raw: css, file: cssFile }],
        safelist,
        rejected: true
      });
      
      if (purgeResult.length > 0) {
        optimizedCss = purgeResult[0].css;
        console.log(`Purged ${purgeResult[0].rejected?.length || 0} unused selectors from ${cssFile}`);
      }
    }
    
    // Extract critical CSS if enabled
    if (CONFIG.criticalCss) {
      const htmlFiles = glob.sync(`${CONFIG.inputDir}/**/*.html`);
      for (const htmlFile of htmlFiles) {
        criticalCss = await extractCriticalCSS(htmlFile, cssFile);
        if (criticalCss) {
          console.log(`Extracted critical CSS for ${htmlFile}`);
        }
      }
    }
    
    // Minify CSS if enabled
    if (CONFIG.minify) {
      const cleanCSS = new CleanCSS({
        level: 2,
        format: 'keep-breaks',
        sourceMap: CONFIG.generateSourceMaps,
        compatibility: {
          properties: {
            colors: true,
            iePrefixHack: false,
            ieSuffixHack: false,
            ieFilters: false,
            zeroUnits: true
          }
        },
        optimizationLevel: 2,
        processImport: true,
        processImportFrom: ['local'],
        rebase: true,
        removeDuplicateRules: true,
        removeEmpty: true,
        removeUnusedAtRules: true,
        restructuring: true,
        roundingPrecision: 2,
        semanticMerging: true,
        shorthandCompacting: true,
        sourceMapInlineSources: true
      });
      
      const minified = cleanCSS.minify(optimizedCss);
      optimizedCss = minified.styles;
      
      if (CONFIG.generateSourceMaps && minified.sourceMap) {
        const sourceMapPath = cssFile.replace('.css', '.min.css.map');
        await writeFile(sourceMapPath, minified.sourceMap.toString());
      }
    }
    
    // Prepare output paths
    const outputPath = cssFile.replace(CONFIG.inputDir, CONFIG.outputDir).replace('.css', '.min.css');
    const criticalOutputPath = outputPath.replace('.min.css', '.critical.min.css');
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write optimized CSS
    await writeFile(outputPath, optimizedCss);
    
    // Write critical CSS if available
    if (criticalCss) {
      await writeFile(criticalOutputPath, criticalCss.css);
    }
    
    // Analyze optimized bundle
    const optimizedAnalysis = await analyzeBundle(outputPath, optimizedCss);
    
    return {
      file: path.basename(cssFile),
      originalSize: originalAnalysis.size,
      originalGzippedSize: originalAnalysis.gzippedSize,
      optimizedSize: optimizedAnalysis.size,
      optimizedGzippedSize: optimizedAnalysis.gzippedSize,
      savings: ((1 - optimizedAnalysis.size / originalAnalysis.size) * 100).toFixed(2),
      hasCriticalCss: !!criticalCss
    };
  } catch (error) {
    console.error(`Error optimizing ${cssFile}:`, error);
    return null;
  }
}

// Update HTML references
async function updateHtmlReferences() {
  const htmlFiles = glob.sync(`${CONFIG.inputDir}/**/*.html`);
  
  for (const htmlFile of htmlFiles) {
    let html = await readFile(htmlFile, 'utf8');
    const relativePath = path.relative(CONFIG.inputDir, htmlFile);
    const outputHtmlPath = path.join(CONFIG.outputDir, relativePath);
    
    // Update CSS references
    for (const cssFile of cssFiles) {
      const relativeCssPath = path.relative(path.dirname(htmlFile), cssFile);
      const relativeMinPath = path.relative(
        path.dirname(outputHtmlPath),
        cssFile.replace(CONFIG.inputDir, CONFIG.outputDir).replace('.css', '.min.css')
      );
      const relativeCriticalPath = relativeMinPath.replace('.min.css', '.critical.min.css');
      
      // Replace link tags with optimized versions
      html = html.replace(
        new RegExp(`<link[^>]*href=["']${relativeCssPath}["'][^>]*>`, 'g'),
        `<link rel="stylesheet" href="${relativeMinPath}">
         <link rel="preload" href="${relativeCriticalPath}" as="style" onload="this.onload=null;this.rel='stylesheet'">
         <noscript><link rel="stylesheet" href="${relativeCriticalPath}"></noscript>`
      );
    }
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.dirname(outputHtmlPath), { recursive: true });
    
    // Write updated HTML
    await writeFile(outputHtmlPath, html);
  }
}

// Main optimization function
async function optimizeCSS() {
  console.log('Starting CSS optimization...');
  console.log(`Input directory: ${CONFIG.inputDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);
  
  const results = [];
  let processed = 0;
  let failed = 0;
  
  // Process all files
  for (const cssFile of cssFiles) {
    const result = await optimizeFile(cssFile);
    if (result) {
      results.push(result);
      processed++;
    } else {
      failed++;
    }
    
    // Log progress
    console.log(`Progress: ${processed + failed}/${cssFiles.length} (${Math.round((processed + failed) / cssFiles.length * 100)}%)`);
  }
  
  // Update HTML references
  await updateHtmlReferences();
  
  // Print optimization report
  console.log('\nCSS optimization complete!');
  console.log(`Successfully processed: ${processed} files`);
  console.log(`Failed to process: ${failed} files`);
  
  if (CONFIG.analyze) {
    console.log('\nOptimization Report:');
    console.log('-------------------');
    results.forEach(result => {
      console.log(`\n${result.file}:`);
      console.log(`  Original size: ${result.originalSize}KB (${result.originalGzippedSize}KB gzipped)`);
      console.log(`  Optimized size: ${result.optimizedSize}KB (${result.optimizedGzippedSize}KB gzipped)`);
      console.log(`  Size reduction: ${result.savings}%`);
      if (result.hasCriticalCss) {
        console.log('  Critical CSS: Generated');
      }
    });
  }
}

// Run optimization with error handling
optimizeCSS().catch(error => {
  console.error('Fatal error during optimization:', error);
  process.exit(1);
}); 