#!/usr/bin/env node

/**
 * BundlePhobia Check Script
 * Simulates BundlePhobia analysis for production bundles
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

function calculateBundlePhobiaMetrics(bundlePath) {
  if (!fs.existsSync(bundlePath)) {
    console.error(`❌ Bundle not found: ${bundlePath}`);
    return null;
  }

  const content = fs.readFileSync(bundlePath);
  const stats = fs.statSync(bundlePath);

  const rawSize = stats.size;
  const gzippedSize = gzipSync(content).length;

  // Parse package.json to get dependencies
  let dependencies = [];
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    dependencies = Object.keys(packageJson.dependencies || {}).map(dep => ({
      name: dep,
      version: packageJson.dependencies[dep]
    }));
  } catch (error) {
    console.warn('⚠️  Could not read package.json');
  }

  return {
    name: 'PrintStack',
    version: '1.0.0',
    size: rawSize,
    gzip: gzippedSize,
    dependencies,
    // Calculate estimated impact on page load
    estimatedImpact: calculatePageLoadImpact(rawSize, gzippedSize)
  };
}

function calculatePageLoadImpact(rawSize, gzippedSize) {
  // These are rough estimates based on typical network conditions
  const threeGSlow = { // 3G Slow (500 Kbps, 400ms RTT)
    download: (gzippedSize * 8) / (500 * 1000), // seconds
    total: 0
  };
  const threeGFast = { // 3G Fast (1 Mbps, 300ms RTT)
    download: (gzippedSize * 8) / (1000 * 1000),
    total: 0
  };
  const fourG = { // 4G (8 Mbps, 100ms RTT)
    download: (gzippedSize * 8) / (8000 * 1000),
    total: 0
  };

  // Add RTT and processing time (rough estimates)
  Object.values([threeGSlow, threeGFast, fourG]).forEach(connection => {
    connection.total = connection.download + 0.5; // Add processing time
  });

  return {
    '3G Slow': `${(threeGSlow.total * 1000).toFixed(0)}ms`,
    '3G Fast': `${(threeGFast.total * 1000).toFixed(0)}ms`,
    '4G': `${(fourG.total * 1000).toFixed(0)}ms`
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateBundlePhobiaReport() {
  const mainBundlePath = path.join(__dirname, '../deploy/index.html');

  if (!fs.existsSync(path.dirname(mainBundlePath))) {
    console.error('❌ Deploy directory not found. Run build first.');
    process.exit(1);
  }

  // Find main JS file
  const deployDir = path.dirname(mainBundlePath);
  const jsFiles = fs.readdirSync(deployDir).filter(file => file.endsWith('.js'));

  if (jsFiles.length === 0) {
    console.error('❌ No JavaScript files found in deploy directory');
    process.exit(1);
  }

  // Use the main bundle or the largest file
  const mainBundle = jsFiles.find(f => f.includes('index') || f.includes('app')) || jsFiles[0];
  const mainBundlePath = path.join(deployDir, mainBundle);

  console.log('📦 BundlePhobia-style Analysis');
  console.log('=' .repeat(40));

  const metrics = calculateBundlePhobiaMetrics(mainBundlePath);

  if (!metrics) {
    console.error('❌ Failed to calculate metrics');
    return;
  }

  // Display package information
  console.log(`\n📊 ${metrics.name} v${metrics.version}`);
  console.log(`Size: ${formatBytes(metrics.size)}`);
  console.log(`Gzipped: ${formatBytes(metrics.gzip)}`);

  // Calculate savings
  const savings = (((metrics.size - metrics.gzip) / metrics.size) * 100).toFixed(1);
  console.log(` 💾 ${savings}% savings with gzip`);

  // Page load impact
  console.log('\n🚀 Page Load Impact (estimated):');
  Object.entries(metrics.estimatedImpact).forEach(([connection, time]) => {
    console.log(`  ${connection}: ${time}`);
  });

  // Performance assessment
  console.log('\n🎯 Performance Assessment:');
  assessPerformance(metrics);

  // Dependencies
  if (metrics.dependencies.length > 0) {
    console.log('\n📚 Dependencies:');
    console.table(metrics.dependencies.map(dep => ({
      Package: dep.name,
      Version: dep.version
    })));
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  generateRecommendations(metrics);

  console.log('\n✅ Analysis complete!');
}

function assessPerformance(metrics) {
  const assessments = [
    {
      metric: 'Bundle Size',
      value: formatBytes(metrics.size),
      good: metrics.size < 200 * 1024, // < 200KB
      warning: metrics.size < 500 * 1024, // < 500KB
      message: 'Raw bundle size'
    },
    {
      metric: 'Gzipped Size',
      value: formatBytes(metrics.gzip),
      good: metrics.gzip < 50 * 1024, // < 50KB
      warning: metrics.gzip < 100 * 1024, // < 100KB
      message: 'Gzipped bundle size'
    },
    {
      metric: 'Compression Ratio',
      value: `${((metrics.size - metrics.gzip) / metrics.size * 100).toFixed(1)}%`,
      good: (metrics.size - metrics.gzip) / metrics.size > 0.7, // > 70%
      warning: (metrics.size - metrics.gzip) / metrics.size > 0.5, // > 50%
      message: 'Compression effectiveness'
    }
  ];

  assessments.forEach(assessment => {
    if (assessment.good) {
      console.log(`  ✅ ${assessment.metric}: ${assessment.value} (${assessment.message} - Good)`);
    } else if (assessment.warning) {
      console.log(`  ⚠️  ${assessment.metric}: ${assessment.value} (${assessment.message} - Could be better)`);
    } else {
      console.log(`  ❌ ${assessment.metric}: ${assessment.value} (${assessment.message} - Poor)`);
    }
  });
}

function generateRecommendations(metrics) {
  const recommendations = [];

  if (metrics.size > 500 * 1024) {
    recommendations.push({
      priority: 'High',
      issue: 'Large bundle size',
      solution: 'Implement aggressive code splitting and lazy loading'
    });
  }

  if (metrics.size > 200 * 1024) {
    recommendations.push({
      priority: 'Medium',
      issue: 'Bundle exceeds optimal size',
      solution: 'Consider removing unused dependencies and optimizing imports'
    });
  }

  const compressionRatio = (metrics.size - metrics.gzip) / metrics.size;
  if (compressionRatio < 0.5) {
    recommendations.push({
      priority: 'Low',
      issue: 'Low compression ratio',
      solution: 'Bundle content might not be text-heavy, review asset types'
    });
  }

  if (metrics.dependencies.length > 20) {
    recommendations.push({
      priority: 'Medium',
      issue: 'Many dependencies',
      solution: 'Review dependencies for alternatives or remove unused ones'
    });
  }

  if (recommendations.length === 0) {
    console.log('  🎉 Great! Bundle size looks optimal.');
  } else {
    recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${rec.issue}: ${rec.solution}`);
    });
  }
}

// Run the analysis
if (require.main === module) {
  generateBundlePhobiaReport();
}

module.exports = { calculateBundlePhobiaMetrics, generateBundlePhobiaReport };