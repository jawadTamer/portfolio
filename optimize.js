const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const { promisify: promisifyFs } = require('util');
const readFile = promisifyFs(fs.readFile);
const writeFile = promisifyFs(fs.writeFile);

// Configuration
const CONFIG = {
  analyze: true,
  generateReports: true,
  parallel: true,
  steps: {
    images: true,
    javascript: true,
    css: true,
    html: true,
    assets: true
  }
};

// Performance metrics
const metrics = {
  startTime: null,
  endTime: null,
  steps: {}
};

// Start timing a step
function startStep(step) {
  metrics.steps[step] = {
    startTime: Date.now()
  };
}

// End timing a step
function endStep(step) {
  if (metrics.steps[step]) {
    metrics.steps[step].endTime = Date.now();
    metrics.steps[step].duration = (metrics.steps[step].endTime - metrics.steps[step].startTime) / 1000;
  }
}

// Generate optimization report
async function generateReport() {
  if (!CONFIG.generateReports) return;
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: (metrics.endTime - metrics.startTime) / 1000,
    steps: metrics.steps,
    summary: {
      totalDuration: 0,
      totalSavings: 0,
      filesProcessed: 0,
      filesOptimized: 0
    }
  };
  
  // Calculate summary
  for (const step of Object.values(metrics.steps)) {
    report.summary.totalDuration += step.duration || 0;
    if (step.savings) {
      report.summary.totalSavings += step.savings;
    }
    if (step.processed) {
      report.summary.filesProcessed += step.processed;
    }
    if (step.optimized) {
      report.summary.filesOptimized += step.optimized;
    }
  }
  
  // Write report
  const reportPath = path.join('dist', 'optimization-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nOptimization report written to ${reportPath}`);
}

// Run a single optimization script
async function runOptimization(script) {
  try {
    console.log(`\nRunning ${script} optimization...`);
    startStep(script);
    
    const { stdout, stderr } = await execAsync(`node ${script}`);
    if (stderr) {
      console.error(`Error in ${script}:`, stderr);
    }
    
    // Parse output for metrics
    const metricsMatch = stdout.match(/Size reduction: ([\d.]+)%/);
    if (metricsMatch) {
      metrics.steps[script].savings = parseFloat(metricsMatch[1]);
    }
    
    const processedMatch = stdout.match(/Successfully processed: (\d+) files/);
    if (processedMatch) {
      metrics.steps[script].processed = parseInt(processedMatch[1]);
    }
    
    const optimizedMatch = stdout.match(/Optimized (\d+) files/);
    if (optimizedMatch) {
      metrics.steps[script].optimized = parseInt(optimizedMatch[1]);
    }
    
    endStep(script);
    console.log(`${script} optimization complete!`);
    return true;
  } catch (error) {
    console.error(`Error running ${script}:`, error);
    endStep(script);
    return false;
  }
}

// Optimize HTML files
async function optimizeHTML() {
  if (!CONFIG.steps.html) return true;
  
  console.log('\nOptimizing HTML files...');
  startStep('html');
  
  try {
    const htmlFiles = glob.sync('dist/portfolio/**/*.html');
    let processed = 0;
    let optimized = 0;
    
    for (const file of htmlFiles) {
      let html = await readFile(file, 'utf8');
      const originalSize = Buffer.byteLength(html, 'utf8');
      
      // Remove comments
      html = html.replace(/<!--[\s\S]*?-->/g, '');
      
      // Remove whitespace
      html = html.replace(/>\s+</g, '><');
      html = html.replace(/\s+/g, ' ');
      
      // Remove empty attributes
      html = html.replace(/\s+[a-z-]+=""/g, '');
      
      const optimizedSize = Buffer.byteLength(html, 'utf8');
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);
      
      if (optimizedSize < originalSize) {
        await writeFile(file, html);
        optimized++;
        console.log(`Optimized ${file} (${savings}% reduction)`);
      }
      
      processed++;
    }
    
    metrics.steps.html = {
      processed,
      optimized,
      savings: optimized > 0 ? (optimized / processed * 100).toFixed(2) : 0
    };
    
    endStep('html');
    console.log('HTML optimization complete!');
    return true;
  } catch (error) {
    console.error('Error optimizing HTML:', error);
    endStep('html');
    return false;
  }
}

// Optimize static assets
async function optimizeAssets() {
  if (!CONFIG.steps.assets) return true;
  
  console.log('\nOptimizing static assets...');
  startStep('assets');
  
  try {
    const assetFiles = glob.sync('dist/portfolio/assets/**/*', {
      ignore: ['**/*.js', '**/*.css', '**/*.html', '**/*.min.*']
    });
    
    let processed = 0;
    let optimized = 0;
    let totalSavings = 0;
    
    for (const file of assetFiles) {
      const ext = path.extname(file).toLowerCase();
      const originalSize = (await fs.promises.stat(file)).size;
      
      let optimizedSize = originalSize;
      
      // Optimize based on file type
      switch (ext) {
        case '.json':
          const json = JSON.parse(await readFile(file, 'utf8'));
          await writeFile(file, JSON.stringify(json));
          optimizedSize = (await fs.promises.stat(file)).size;
          break;
          
        case '.svg':
          const { stdout } = await execAsync(`svgo ${file} -o ${file}`);
          optimizedSize = (await fs.promises.stat(file)).size;
          break;
          
        case '.woff':
        case '.woff2':
        case '.ttf':
        case '.eot':
          // Font files are already optimized
          break;
          
        default:
          // Skip other file types
          continue;
      }
      
      if (optimizedSize < originalSize) {
        const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);
        totalSavings += parseFloat(savings);
        optimized++;
        console.log(`Optimized ${file} (${savings}% reduction)`);
      }
      
      processed++;
    }
    
    metrics.steps.assets = {
      processed,
      optimized,
      savings: optimized > 0 ? (totalSavings / optimized).toFixed(2) : 0
    };
    
    endStep('assets');
    console.log('Asset optimization complete!');
    return true;
  } catch (error) {
    console.error('Error optimizing assets:', error);
    endStep('assets');
    return false;
  }
}

// Main optimization function
async function optimize() {
  console.log('Starting optimization process...');
  metrics.startTime = Date.now();
  
  try {
    // Run optimizations in parallel if enabled
    if (CONFIG.parallel) {
      const optimizations = [];
      
      if (CONFIG.steps.images) {
        optimizations.push(runOptimization('optimize-images.js'));
      }
      if (CONFIG.steps.javascript) {
        optimizations.push(runOptimization('optimize-js.js'));
      }
      if (CONFIG.steps.css) {
        optimizations.push(runOptimization('optimize-css.js'));
      }
      
      await Promise.all(optimizations);
    } else {
      // Run optimizations sequentially
      if (CONFIG.steps.images) {
        await runOptimization('optimize-images.js');
      }
      if (CONFIG.steps.javascript) {
        await runOptimization('optimize-js.js');
      }
      if (CONFIG.steps.css) {
        await runOptimization('optimize-css.js');
      }
    }
    
    // Run HTML and asset optimization
    await optimizeHTML();
    await optimizeAssets();
    
    // Generate report
    metrics.endTime = Date.now();
    await generateReport();
    
    console.log('\nOptimization process complete!');
    console.log(`Total duration: ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)}s`);
    
    // Print summary
    if (CONFIG.analyze) {
      console.log('\nOptimization Summary:');
      console.log('-------------------');
      for (const [step, data] of Object.entries(metrics.steps)) {
        console.log(`\n${step}:`);
        console.log(`  Duration: ${data.duration.toFixed(2)}s`);
        if (data.savings) {
          console.log(`  Average savings: ${data.savings}%`);
        }
        if (data.processed) {
          console.log(`  Files processed: ${data.processed}`);
        }
        if (data.optimized) {
          console.log(`  Files optimized: ${data.optimized}`);
        }
      }
    }
  } catch (error) {
    console.error('Fatal error during optimization:', error);
    process.exit(1);
  }
}

// Run optimization
optimize(); 