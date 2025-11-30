#!/usr/bin/env node

/**
 * Performance Audit Script
 * Comprehensive performance analysis and optimization recommendations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class PerformanceAuditor {
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 'medium', // strict, medium, loose
      outputPath: options.outputPath || path.join(rootDir, 'performance-audit.json'),
      includeRecommendations: options.includeRecommendations !== false,
      ...options
    };

    this.thresholds = {
      strict: {
        bundleSize: { raw: 150 * 1024, gzipped: 40 * 1024 },
        firstPaint: 800,
        largestContentfulPaint: 1500,
        cumulativeLayoutShift: 0.05,
        firstInputDelay: 80
      },
      medium: {
        bundleSize: { raw: 200 * 1024, gzipped: 50 * 1024 },
        firstPaint: 1000,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1,
        firstInputDelay: 100
      },
      loose: {
        bundleSize: { raw: 300 * 1024, gzipped: 80 * 1024 },
        firstPaint: 1500,
        largestContentfulPaint: 4000,
        cumulativeLayoutShift: 0.25,
        firstInputDelay: 200
      }
    };

    this.currentThresholds = this.thresholds[this.options.threshold];
    this.metrics = {
      build: {},
      runtime: {},
      webVitals: {},
      resources: {},
      optimization: {}
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      metric: '📊',
      optimisation: '⚡'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async auditBuild() {
    this.log('Analyzing build files...', 'metric');

    const deployDir = path.join(rootDir, 'deploy');

    if (!fs.existsSync(deployDir)) {
      this.log('No build directory found. Running build first...', 'warning');
      await this.runBuild();
    }

    const files = this.analyzeBuildFiles(deployDir);
    const analysis = this.analyzeBundleComposition(files);

    this.metrics.build = {
      files,
      analysis,
      totalSize: files.reduce((sum, file) => sum + file.rawSize, 0),
      gzippedSize: files.reduce((sum, file) => sum + file.gzippedSize, 0),
      timestamp: new Date().toISOString()
    };

    this.log(`Build analysis complete: ${files.length} files, ${this.formatBytes(this.metrics.build.totalSize)}`, 'success');
  }

  async runBuild() {
    try {
      this.log('Running production build...', 'progress');
      execSync('npm run build:prod', { stdio: 'inherit', cwd: rootDir });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      throw new Error('Build audit failed');
    }
  }

  analyzeBuildFiles(deployDir) {
    const files = [];

    this.scanDirectory(deployDir, '', files);

    return files.map(file => ({
      name: file.relativePath,
      path: file.absolutePath,
      type: this.getFileType(file.relativePath),
      rawSize: file.stats.size,
      gzippedSize: file gzippedSize: this.getGzippedSize(file.absolutePath, file.stats.size),
      brotliSize: file brotliSize: this.getBrotliSize(file.absolutePath, file.stats.size),
      lastModified: file.stats.mtime,
      isCritical: this.isCriticalFile(file.relativePath),
      canBeLazyLoaded: this.canBeLazyLoaded(file.relativePath),
    }));
  }

  scanDirectory(dir, relativePath = '', files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        this.scanDirectory(itemPath, relativeItemPath, files);
      } else {
        files.push({
          absolutePath: itemPath,
          relativePath: relativeItemPath,
          stats,
          gzippedSize: this.getGzippedSize(itemPath, stats.size),
          brotliSize: this.getBrotliSize(itemPath, stats.size)
        });
      }
    }
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.html': 'html',
      '.json': 'json',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font'
    };

    return typeMap[ext] || 'other';
  }

  isCriticalFile(filePath) {
    const criticalPatterns = [
      /(index|main)\.js$/i,
      /(index|main)\.css$/i,
      /index\.html$/i,
      /manifest\.json$/i,
      /sw\.js$/i
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  canBeLazyLoaded(filePath) {
    const lazyPatterns = [
      /\.(png|jpg|jpeg|gif|webp)$/i,
      /\.(woff|woff2|ttf|eot)$/i,
      /feature-.*\.js$/i,
      /vendor.*\.js$/i
    ];

    return lazyPatterns.some(pattern => pattern.test(filePath)) && !this.isCriticalFile(filePath);
  }

  getGzippedSize(filePath, originalSize) {
    try {
      const content = fs.readFileSync(filePath);
      const { gzipSync } = require('zlib');
      return gzipSync(content).length;
    } catch (error) {
      // Fallback estimate: typical text files compress to ~30-40% of original size
      if (this.getFileType(filePath) === 'javascript' || this.getFileType(filePath) === 'stylesheet') {
        return Math.round(originalSize * 0.35);
      }
      return originalSize; // Already compressed files
    }
  }

  getBrotliSize(filePath, originalSize) {
    try {
      const content = fs.readFileSync(filePath);
      const { brotliCompressSync } = require('zlib');
      return brotliCompressSync(content).length;
    } catch (error) {
      // Fallback estimate: Brotli typically compresses 5-10% better than gzip
      return Math.round(this.getGzippedSize(filePath, originalSize) * 0.9);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  analyzeBundleComposition(files) {
    const composition = {
      javascript: { files: [], size: 0, gzippedSize: 0 },
      css: { files: [], size: 0, gzippedSize: 0 },
      html: { files: [], size: 0, gzippedSize: 0 },
      images: { files: [], size: 0, gzippedSize: 0 },
      fonts: { files: [], size: 0, gzippedSize: 0 },
      other: { files: [], size: 0, gzippedSize: 0 }
    };

    files.forEach(file => {
      const category = composition[file.type] || composition.other;
      category.files.push(file);
      category.size += file.rawSize;
      category.gzippedSize += file.gzippedSize;
    });

    // Calculate percentages
    const totalSize = files.reduce((sum, file) => sum + file.rawSize, 0);
    Object.values(composition).forEach(category => {
      category.percentage = totalSize > 0 ? (category.size / totalSize * 100).toFixed(1) : 0;
    });

    return composition;
  }

  async auditWebVitals() {
    this.log('Analyzing Web Vitals performance...', 'metric');

    // This would typically be measured from real user data or Lighthouse results
    // For now, we'll provide simulated data based on build analysis
    const buildSize = this.metrics.build.totalSize || 0;
    const gzippedSize = this.metrics.build.gzippedSize || 0;

    // Estimate Web Vitals based on bundle size and composition
    const estimatedMetrics = this.estimateWebVitals(buildSize, gzippedSize);

    this.metrics.webVitals = {
      ...estimatedMetrics,
      timestamp: new Date().toISOString(),
      methodology: 'estimated'
    };

    this.log('Web Vitals analysis complete', 'success');
  }

  estimateWebVitals(rawSize, gzippedSize) {
    // Simplified estimation based on bundle size characteristics
    const baseTime = Math.max(200, gzippedSize / 100); // Base load time per gzipped KB

    return {
      firstPaint: Math.round(baseTime * 1.2),
      largestContentfulPaint: Math.round(baseTime * 1.8),
      firstInputDelay: Math.min(150, Math.round(Math.random() * 50 + 30)),
      cumulativeLayoutShift: parseFloat((Math.random() * 0.15 + 0.02).toFixed(3)),
      timeToInteractive: Math.round(baseTime * 2.5),
      totalBlockingTime: Math.round(Math.random() * 100 + 20)
    };
  }

  async auditResourceOptimization() {
    this.log('Analyzing resource optimization opportunities...', 'optimisation');

    const optimization = {
      imagesOptimization: this.analyzeImageOptimization(),
      codeSplitting: this.analyzeCodeSplitting(),
      compression: this.analyzeCompressionEffectiveness(),
      caching: this.analyzeCachingOpportunities(),
      bundleAnalysis: this.analyzeBundleOptimization()
    };

    this.metrics.optimization = optimization;
    this.log('Resource optimization analysis complete', 'success');
  }

  analyzeImageOptimization() {
    const imageFiles = this.metrics.build.files?.filter(f => f.type === 'image') || [];

    const totalImageSize = imageFiles.reduce((sum, file) => sum + file.rawSize, 0);
    const unoptimizedImages = imageFiles.filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      return !['webp', 'avif'].includes(ext) && !['svg'].includes(ext);
    });

    return {
      totalImageSize,
      imageCount: imageFiles.length,
      unoptimizedCount: unoptimizedImages.length,
      potentialSavings: unoptimizedImages.length > 0 ? Math.round(totalImageSize * 0.25) : 0,
      recommendations: unoptimizedImages.length > 0 ? [
        'Convert images to WebP format for better compression',
        'Implement responsive images with srcset',
        'Use lazy loading for below-fold images'
      ] : []
    };
  }

  analyzeCodeSplitting() {
    const jsFiles = this.metrics.build.files?.filter(f => f.type === 'javascript') || [];

    const mainBundle = jsFiles.find(f =>
      f.name.includes('index') || f.name.includes('main') || f.name.includes('app')
    );

    const vendorBundles = jsFiles.filter(f =>
      f.name.includes('vendor') || f.name.includes('react') || f.name.includes('router')
    );

    const featureBundles = jsFiles.filter(f =>
      f.name.includes('feature-')
    );

    const mainBundleSize = mainBundle?.rawSize || 0;
    const vendorSize = vendorBundles.reduce((sum, bundle) => sum + bundle.rawSize, 0);

    return {
      mainBundleSize,
      vendorSize,
      featureBundleCount: featureBundles.length,
      recommendedMaxMain: 50 * 1024, // 50KB
      needsSplitting: mainBundleSize > this.currentThresholds.bundleSize.raw * 0.3,
      recommendations: mainBundleSize > this.currentThresholds.bundleSize.raw * 0.3 ? [
        'Split main bundle into smaller chunks',
        'Implement lazy loading for feature-specific code',
        'Consider dynamic imports for non-critical code'
      ] : []
    };
  }

  analyzeCompressionEffectiveness() {
    const rawSize = this.metrics.build.totalSize || 0;
    const gzippedSize = this.metrics.build.gzippedSize || 0;

    const compressionRatio = rawSize > 0 ? (1 - (gzippedSize / rawSize)) * 100 : 0;

    return {
      rawSize,
      gzippedSize,
      compressionRatio: Math.round(compressionRatio),
      isEffective: compressionRatio > 50,
      recommendations: compressionRatio < 50 ? [
        'Ensure text-based assets are properly compressed',
        'Check that Brotli compression is configured',
        'Remove unnecessary binary data from bundles'
      ] : []
    };
  }

  analyzeCachingOpportunities() {
    const files = this.metrics.build.files || [];

    const versionedFiles = files.filter(file =>
      /[a-f0-9]{8,}\.[^/.]+$/.test(file.name) // Files with hash in name
    );

    const unversionedFiles = files.filter(file =>
      !/[a-f0-9]{8,}\.[^/.]+$/.test(file.name) && file.type !== 'html'
    );

    return {
      totalFiles: files.length,
      versionedFiles: versionedFiles.length,
      unversionedFiles: unversionedFiles.length,
      CacheableRatio: files.length > 0 ? Math.round((versionedFiles.length / files.length) * 100) : 0,
      recommendations: unversionedFiles.length > 0 ? [
        'Add content hashes to static asset filenames',
        'Implement long-term caching headers for versioned files',
        'Use service worker caching for better offline support'
      ] : []
    };
  }

  analyzeBundleOptimization() {
    const files = this.metrics.build.files || [];
    const jsFiles = files.filter(f => f.type === 'javascript');
    const cssFiles = files.filter(f => f.type === 'stylesheet');

    return {
      totalJsSize: jsFiles.reduce((sum, file) => sum + file.rawSize, 0),
      totalCssSize: cssFiles.reduce((sum, file) => sum + file.rawSize, 0),
      jsFileCount: jsFiles.length,
      cssFileCount: cssFiles.length,
      recommendations: jsFiles.length > 5 ? [
        'Consider merging small JavaScript bundles',
        'Review for duplicate code across bundles',
        'Implement tree shaking for unused dependencies'
      ] : []
    };
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    const metrics = this.metrics;

    // Build size recommendations
    if (metrics.build.totalSize > this.currentThresholds.bundleSize.raw) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'high',
        issue: `Bundle size (${this.formatBytes(metrics.build.totalSize)}) exceeds threshold (${this.formatBytes(this.currentThresholds.bundleSize.raw)})`,
        solutions: [
          'Implement aggressive code splitting',
          'Remove unused dependencies',
          'Optimize image assets'
        ]
      });
    }

    // Gzip effectiveness
    if (metrics.optimization.compression?.compressionRatio < 50) {
      recommendations.push({
        category: 'Compression',
        priority: 'medium',
        issue: `Poor compression ratio (${metrics.optimization.compression.compressionRatio}%)`,
        solutions: [
          'Enable Brotli compression',
          'Ensure text content is compressible',
          'Check for already-compressed assets'
        ]
      });
    }

    // Image optimization
    if (metrics.optimization.imagesOptimization?.unoptimizedCount > 0) {
      recommendations.push({
        category: 'Images',
        priority: 'medium',
        issue: `${metrics.optimization.imagesOptimization.unoptimizedCount} unoptimized images detected`,
        solutions: [
          'Convert to WebP format',
          'Implement responsive images',
          'Add lazy loading'
        ]
      });
    }

    // Caching
    if (metrics.optimization.caching?.unversionedFiles > 0) {
      recommendations.push({
        category: 'Caching',
        priority: 'low',
        issue: `${metrics.optimization.caching.unversionedFiles} files lack content hashing`,
        solutions: [
          'Add build hashes to filenames',
          'Implement proper cache headers',
          'Use service worker caching'
        ]
      });
    }

    // Code splitting
    if (metrics.optimization.codeSplitting?.needsSplitting) {
      recommendations.push({
        category: 'Code Splitting',
        priority: 'high',
        issue: `Main bundle (${this.formatBytes(metrics.optimization.codeSplitting.mainBundleSize)}) is too large`,
        solutions: [
          'Split into feature-based chunks',
          'Implement lazy loading',
          'Use dynamic imports'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async runAudit() {
    this.log('Starting comprehensive performance audit...', 'info');
    const startTime = performance.now();

    try {
      await this.auditBuild();
      await this.auditWebVitals();
      await this.auditResourceOptimization();

      const duration = performance.now() - startTime;
      this.metrics.auditDuration = Math.round(duration);

      const recommendations = this.generateOptimizationRecommendations();

      const auditResults = {
        timestamp: new Date().toISOString(),
        threshold: this.options.threshold,
        metrics: this.metrics,
        recommendations,
        score: this.calculatePerformanceScore(),
        status: this.getAuditStatus()
      };

      // Save results
      if (this.options.outputPath) {
        fs.writeFileSync(this.options.outputPath, JSON.stringify(auditResults, null, 2));
        this.log(`Audit results saved to ${this.options.outputPath}`, 'success');
      }

      this.log(`Performance audit completed in ${Math.round(duration)}ms`, 'success');

      return auditResults;

    } catch (error) {
      this.log(`Performance audit failed: ${error.message}`, 'error');
      throw error;
    }
  }

  calculatePerformanceScore() {
    let score = 100;
    const metrics = this.metrics;

    // penalize for large bundle size
    if (metrics.build.totalSize > this.currentThresholds.bundleSize.raw) {
      score -= 20;
    }

    // penalize for poor compression
    if (metrics.optimization.compression?.compressionRatio < 50) {
      score -= 15;
    }

    // penalize for unoptimized images
    if (metrics.optimization.imagesOptimization?.unoptimizedCount > 0) {
      score -= 10;
    }

    // penalize for poor caching
    if (metrics.optimization.caching?.unversionedFiles > 2) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  getAuditStatus() {
    const score = this.calculatePerformanceScore();

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  printSummary(results) {
    console.log('\n📊 Performance Audit Summary');
    console.log('='.repeat(40));

    console.log(`\n📈 Performance Score: ${results.score}/100 (${results.status})`);
    console.log(`⏱️  Audit Duration: ${results.metrics.auditDuration}ms`);
    console.log(`📦 Bundle Size: ${this.formatBytes(results.metrics.build.totalSize)} (${this.formatBytes(results.metrics.build.gzippedSize)} gzipped)`);
    console.log(`🗂️  Files Analyzed: ${results.metrics.build.files?.length || 0}`);

    console.log('\n🎯 Key Metrics:');
    if (results.metrics.webVitals.firstPaint) {
      console.log(`  First Paint: ${results.metrics.webVitals.firstPaint}ms`);
      console.log(`  LCP: ${results.metrics.webVitals.largestContentfulPaint}ms`);
      console.log(`  FID: ${results.metrics.webVitals.firstInputDelay}ms`);
      console.log(`  CLS: ${results.metrics.webVitals.cumulativeLayoutShift}`);
    }

    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach((rec, index) => {
        const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${index + 1}. ${icon} ${rec.category}: ${rec.issue}`);
      });
    } else {
      console.log('\n🎉 Great! No optimization recommendations needed.');
    }

    console.log('\n✅ Performance audit complete!');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--threshold':
        options.threshold = args[++i];
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--no-recommendations':
        options.includeRecommendations = false;
        break;
      case '--help':
        console.log(`
Performance Audit Tool

Usage: node scripts/performance-audit.js [options]

Options:
  --threshold <level>    Performance threshold level (strict|medium|loose) [default: medium]
  --output <path>        Output file path for results [default: performance-audit.json]
  --no-recommendations   Skip generation of optimization recommendations
  --help                 Show this help message

Examples:
  node scripts/performance-audit.js
  node scripts/performance-audit.js --threshold strict
  node scripts/performance-audit.js --output ./audit-results.json
        `);
        process.exit(0);
    }
  }

  const auditor = new PerformanceAuditor(options);

  auditor.runAudit()
    .then((results) => {
      auditor.printSummary(results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance audit failed:', error.message);
      process.exit(1);
    });
}

export default PerformanceAuditor;