#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the built bundle for size metrics and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { gzipSync, brotliCompressSync } = require('zlib');

function analyzeBundle() {
  const deployDir = path.join(__dirname, '../deploy');

  if (!fs.existsSync(deployDir)) {
    console.error('❌ Deploy directory not found. Run build first.');
    process.exit(1);
  }

  const jsFiles = fs.readdirSync(deployDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(deployDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);

      return {
        name: file,
        size: stats.size,
        gzip: gzipSync(content).length,
        brotli: brotliCompressSync(content).length,
        content
      };
    })
    .sort((a, b) => b.size - a.size);

  console.log('\n📊 Bundle Analysis Report');
  console.log('=' .repeat(50));

  if (jsFiles.length === 0) {
    console.log('❌ No JavaScript files found in deploy directory');
    return;
  }

  let totalSize = 0;
  let totalGzip = 0;
  let totalBrotli = 0;

  console.log('\n🔍 File Details:');
  console.table(
    jsFiles.map(file => {
      totalSize += file.size;
      totalGzip += file.gzip;
      totalBrotli += file.brotli;

      return {
        'File': file.name,
        'Size': `${formatBytes(file.size)}`,
        'Gzip': `${formatBytes(file.gzip)} (${Math.round(file.gzip / file.size * 100)}%)`,
        'Brotli': `${formatBytes(file.brotli)} (${Math.round(file.brotli / file.size * 100)}%)`,
      };
    })
  );

  console.log('\n📈 Totals:');
  console.log(`Raw Size:    ${formatBytes(totalSize)}`);
  console.log(`Gzip Size:   ${formatBytes(totalGzip)} (${Math.round(totalGzip / totalSize * 100)}%)`);
  console.log(`Brotli Size: ${formatBytes(totalBrotli)} (${Math.round(totalBrotli / totalSize * 100)}%)`);

  console.log('\n🎯 Performance Targets:');
  checkPerformanceTargets(totalSize, totalGzip);

  console.log('\n🧩 Chunk Analysis:');
  analyzeChunkDistribution(jsFiles);

  console.log('\n🔍 Code Analysis:');
  analyzeCodeContent(jsFiles);

  console.log('\n💡 Optimization Suggestions:');
  generateOptimizationSuggestions(jsFiles, totalSize);

  console.log('\n✅ Bundle analysis complete!');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkPerformanceTargets(totalSize, totalGzip) {
  const targets = [
    { name: 'Total Bundle Size', current: totalSize, target: 200 * 1024, unit: 'KB' },
    { name: 'Gzipped Bundle Size', current: totalGzip, target: 50 * 1024, unit: 'KB' },
    { name: 'Individual Chunk Size', current: Math.max(...jsFiles.map(f => f.size)), target: 50 * 1024, unit: 'KB' }
  ];

  targets.forEach(target => {
    const currentValue = target.current / 1024; // Convert to KB
    const targetValue = target.target / 1024;
    const passed = currentValue <= targetValue;

    console.log(`  ${passed ? '✅' : '❌'} ${target.name}: ${currentValue.toFixed(2)}${target.unit} (Target: ≤${targetValue}${target.unit})`);
  });
}

function analyzeChunkDistribution(jsFiles) {
  const vendorFiles = jsFiles.filter(file =>
    file.name.includes('vendor') || file.name.includes('react')
  );
  const featureFiles = jsFiles.filter(file =>
    file.name.includes('feature-') || file.name.includes('feature')
  );
  const appFiles = jsFiles.filter(file =>
    !vendorFiles.includes(file) && !featureFiles.includes(file)
  );

  console.log(`  🔧 Vendor Code: ${vendorFiles.length} files, ${formatBytes(vendorFiles.reduce((sum, f) => sum + f.size, 0))}`);
  console.log(`  📦 Feature Code: ${featureFiles.length} files, ${formatBytes(featureFiles.reduce((sum, f) => sum + f.size, 0))}`);
  console.log(`  📱 App Code: ${appFiles.length} files, ${formatBytes(appFiles.reduce((sum, f) => sum + f.size, 0))}`);

  // Check for optimal distribution
  const vendorPercentage = (vendorFiles.reduce((sum, f) => sum + f.size, 0) / jsFiles.reduce((sum, f) => sum + f.size, 0)) * 100;
  console.log(`  📊 Vendor code percentage: ${vendorPercentage.toFixed(1)}%`);

  if (vendorPercentage > 60) {
    console.log(`  ⚠️  Consider splitting vendor code more aggressively`);
  }
}

function analyzeCodeContent(jsFiles) {
  jsFiles.forEach(file => {
    const content = file.content.toString();
    const lines = content.split('\n').length;
    const comments = (content.match(/(\/\/.*|\/\*[\s\S]*?\*\/)/g) || []).join('').length;

    console.log(`  📄 ${file.name}:`);
    console.log(`     Lines: ${lines.toLocaleString()}`);
    console.log(`     Comments: ${(comments / content.length * 100).toFixed(1)}%`);

    // Check for unused imports or console statements
    if (content.includes('console.log') || content.includes('console.debug')) {
      console.log(`     ⚠️  Contains console statements`);
    }

    if (content.includes('debugger')) {
      console.log(`     ⚠️  Contains debugger statements`);
    }
  });
}

function generateOptimizationSuggestions(jsFiles, totalSize) {
  const suggestions = [];

  // Large files analysis
  const largeFiles = jsFiles.filter(file => file.size > 50 * 1024);
  if (largeFiles.length > 0) {
    suggestions.push({
      priority: 'High',
      issue: 'Large chunks detected',
      solution: 'Consider splitting large chunks or implementing lazy loading',
      files: largeFiles.map(f => f.name)
    });
  }

  // Vendor code optimization
  const vendorCodeSize = jsFiles
    .filter(file => file.name.includes('vendor') || file.name.includes('react'))
    .reduce((sum, f) => sum + f.size, 0);

  if (vendorCodeSize > 100 * 1024) {
    suggestions.push({
      priority: 'Medium',
      issue: 'Large vendor bundle',
      solution: 'Consider tree shaking or using smaller alternatives',
      size: formatBytes(vendorCodeSize)
    });
  }

  // Check for potential duplicate code
  const chunkPatterns = {};
  jsFiles.forEach(file => {
    Object.keys(chunkPatterns).forEach(pattern => {
      if (file.name.includes(pattern)) {
        chunkPatterns[pattern].push(file);
      }
    });
  });

  // Bundle size optimization
  if (totalSize > 200 * 1024) {
    suggestions.push({
      priority: 'High',
      issue: 'Bundle size exceeds target',
      solution: 'Implement code splitting and lazy loading strategies',
      current: formatBytes(totalSize),
      target: '< 200KB'
    });
  }

  // Console/staging code
  const hasDebugCode = jsFiles.some(file =>
    file.content.includes('console.log') || file.content.includes('debugger')
  );
  if (hasDebugCode) {
    suggestions.push({
      priority: 'Low',
      issue: 'Debug code detected in production',
      solution: 'Remove console.log and debugger statements or use build-time removal'
    });
  }

  suggestions.forEach((suggestion, index) => {
    const icon = suggestion.priority === 'High' ? '🔴' : suggestion.priority === 'Medium' ? '🟡' : '🟢';
    console.log(`  ${index + 1}. ${suggestion.priority}: ${suggestion.issue}`);
    console.log(`     Solution: ${suggestion.solution}`);
    if (suggestion.files) console.log(`     Files: ${suggestion.files.join(', ')}`);
    if (suggestion.size) console.log(`     Size: ${suggestion.size}`);
    if (suggestion.current && suggestion.target) console.log(`     Current: ${suggestion.current}, Target: ${suggestion.target}`);
    console.log('');
  });
}

// Run the analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };