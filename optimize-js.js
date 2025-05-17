const { minify } = require('terser');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const { exec } = require('child_process');
const { promisify: promisifyExec } = require('util');
const execAsync = promisifyExec(exec);

// Configuration
const CONFIG = {
  inputDir: 'dist/portfolio',
  outputDir: 'dist/portfolio/optimized',
  chunkSize: 50000, // Size in bytes for code splitting
  modernBrowsers: true,
  analyze: true,
  generateSourceMaps: true,
  preserveImportantComments: true
};

// Get all JavaScript files
const jsFiles = glob.sync(`${CONFIG.inputDir}/**/*.js`, {
  ignore: [
    '**/*.min.js',
    '**/polyfills*.js',
    '**/runtime*.js',
    '**/vendor*.js',
    '**/optimized/**'
  ]
});

// Analyze bundle size
async function analyzeBundle(filePath, code) {
  const size = Buffer.byteLength(code, 'utf8');
  const gzippedSize = await execAsync(`echo "${code}" | gzip -c | wc -c`);
  return {
    file: path.basename(filePath),
    size: (size / 1024).toFixed(2),
    gzippedSize: (parseInt(gzippedSize.stdout) / 1024).toFixed(2)
  };
}

// Split code into chunks
function splitCode(code, chunkSize) {
  const chunks = [];
  let currentChunk = '';
  const lines = code.split('\n');
  
  for (const line of lines) {
    if (Buffer.byteLength(currentChunk + line, 'utf8') > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Generate source map
async function generateSourceMap(code, originalFile, minifiedFile) {
  if (!CONFIG.generateSourceMaps) return null;
  
  const sourceMap = {
    version: 3,
    sources: [originalFile],
    names: [],
    mappings: '',
    file: minifiedFile
  };
  
  return JSON.stringify(sourceMap);
}

// Optimize a single JavaScript file
async function optimizeFile(file) {
  try {
    const code = await readFile(file, 'utf8');
    
    // Skip if already minified
    if (file.includes('.min.js')) return null;
    
    // Analyze original bundle
    const originalAnalysis = await analyzeBundle(file, code);
    
    // Split code if needed
    const chunks = splitCode(code, CONFIG.chunkSize);
    const optimizedChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await minify(chunk, {
        compress: {
          dead_code: true,
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
          passes: 5,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
          booleans_as_integers: true,
          collapse_vars: true,
          evaluate: true,
          hoist_funs: true,
          hoist_props: true,
          hoist_vars: true,
          if_return: true,
          inline: true,
          join_vars: true,
          keep_infinity: true,
          loops: true,
          module: true,
          properties: true,
          reduce_funcs: true,
          reduce_vars: true,
          sequences: true,
          side_effects: true,
          switches: true,
          toplevel: true,
          typeofs: true,
          unused: true,
          ecma: CONFIG.modernBrowsers ? 2020 : 5
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/,
            keep_quoted: true,
            reserved: ['$', 'jQuery', 'angular', 'ng']
          },
          safari10: true
        },
        format: {
          comments: CONFIG.preserveImportantComments ? /^!/ : false,
          ascii_only: true,
          beautify: false,
          braces: false,
          ecma: CONFIG.modernBrowsers ? 2020 : 5,
          keep_numbers: false,
          keep_quoted_props: false,
          max_line_len: 80,
          preamble: '/* Minified by Terser */',
          quote_keys: false,
          quote_style: 3,
          semicolons: true,
          shebang: false,
          webkit: true,
          wrap_iife: true,
          wrap_func_args: true
        },
        ecma: CONFIG.modernBrowsers ? 2020 : 5,
        module: true,
        toplevel: true,
        sourceMap: CONFIG.generateSourceMaps,
        nameCache: null,
        ie8: !CONFIG.modernBrowsers,
        keep_classnames: false,
        keep_fnames: false,
        safari10: true
      });
      
      if (result.code) {
        optimizedChunks.push(result.code);
      }
    }
    
    const optimizedCode = optimizedChunks.join('\n');
    const outputPath = file.replace(CONFIG.inputDir, CONFIG.outputDir).replace('.js', '.min.js');
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write optimized code
    await writeFile(outputPath, optimizedCode);
    
    // Generate and write source map if enabled
    if (CONFIG.generateSourceMaps) {
      const sourceMap = await generateSourceMap(code, file, outputPath);
      await writeFile(`${outputPath}.map`, sourceMap);
      await writeFile(outputPath, `${optimizedCode}\n//# sourceMappingURL=${path.basename(outputPath)}.map`);
    }
    
    // Analyze optimized bundle
    const optimizedAnalysis = await analyzeBundle(outputPath, optimizedCode);
    
    return {
      file: path.basename(file),
      originalSize: originalAnalysis.size,
      originalGzippedSize: originalAnalysis.gzippedSize,
      optimizedSize: optimizedAnalysis.size,
      optimizedGzippedSize: optimizedAnalysis.gzippedSize,
      savings: ((1 - optimizedAnalysis.size / originalAnalysis.size) * 100).toFixed(2)
    };
  } catch (error) {
    console.error(`Error optimizing ${file}:`, error);
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
    
    // Update script references
    for (const file of jsFiles) {
      const relativeJsPath = path.relative(path.dirname(htmlFile), file);
      const relativeMinPath = path.relative(
        path.dirname(outputHtmlPath),
        file.replace(CONFIG.inputDir, CONFIG.outputDir).replace('.js', '.min.js')
      );
      
      // Replace script tags with optimized versions
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${relativeJsPath}["'][^>]*>`, 'g'),
        `<script src="${relativeMinPath}" defer></script>`
      );
    }
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.dirname(outputHtmlPath), { recursive: true });
    
    // Write updated HTML
    await writeFile(outputHtmlPath, html);
  }
}

// Main optimization function
async function optimizeJS() {
  console.log('Starting JavaScript optimization...');
  console.log(`Input directory: ${CONFIG.inputDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);
  
  const results = [];
  let processed = 0;
  let failed = 0;
  
  // Process all files
  for (const file of jsFiles) {
    const result = await optimizeFile(file);
    if (result) {
      results.push(result);
      processed++;
    } else {
      failed++;
    }
    
    // Log progress
    console.log(`Progress: ${processed + failed}/${jsFiles.length} (${Math.round((processed + failed) / jsFiles.length * 100)}%)`);
  }
  
  // Update HTML references
  await updateHtmlReferences();
  
  // Print optimization report
  console.log('\nJavaScript optimization complete!');
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
    });
  }
}

// Run optimization with error handling
optimizeJS().catch(error => {
  console.error('Fatal error during optimization:', error);
  process.exit(1);
}); 