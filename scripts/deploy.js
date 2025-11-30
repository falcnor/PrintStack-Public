#!/usr/bin/env node

/**
 * Automated Deployment Pipeline Script
 * Handles complete deployment workflow from build to production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class DeploymentPipeline {
  constructor(options = {}) {
    this.options = {
      force: options.force || false,
      skipTests: options.skipTests || false,
      skipLinting: options.skipLinting || false,
      skipOptimization: options.skipOptimization || false,
      environment: options.environment || 'production',
      ...options
    };

    this.deployDir = path.join(rootDir, 'deploy');
    this.buildDir = path.join(rootDir, 'dist');
    this.results = {
      timestamp: new Date().toISOString(),
      stage: 'initialization',
      steps: [],
      errors: [],
      warnings: [],
      metrics: {}
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '⏳'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);

    this.results.steps.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      stage: this.results.stage
    });
  }

  async executeCommand(command, description) {
    try {
      this.log(`Running: ${description}`, 'progress');
      execSync(command, { stdio: 'inherit', cwd: rootDir });
      this.log(`Completed: ${description}`, 'success');
      return true;
    } catch (error) {
      const errorMsg = `Failed: ${description} - ${error.message}`;
      this.log(errorMsg, 'error');
      this.results.errors.push(errorMsg);
      return false;
    }
  }

  async checkPrerequisites() {
    this.results.stage = 'prerequisites';
    this.log('Checking deployment prerequisites...', 'progress');

    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      this.log(`Node.js version ${nodeVersion} is too old. Requires v16+`, 'error');
      throw new Error('Node.js version requirement not met');
    }
    this.log(`Node.js version: ${nodeVersion} ✓`, 'success');

    // Check dependencies
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const nodeModulesPath = path.join(rootDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      this.log('Dependencies not installed. Running npm install...', 'warning');
      await this.executeCommand('npm install', 'Dependency installation');
    }

    // Check git status (optional, for clean deployments)
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8', cwd: rootDir });
      if (gitStatus.trim() && !this.options.force) {
        this.log('Working directory is not clean. Consider committing changes first.', 'warning');
        this.results.warnings.push('Uncommitted changes detected');
      }
    } catch (error) {
      this.log('Not a git repository - skipping status check', 'info');
    }

    this.log('Prerequisites check completed', 'success');
  }

  async runTests() {
    if (this.options.skipTests) {
      this.log('Skipping tests (skipTests option enabled)', 'warning');
      return true;
    }

    this.results.stage = 'testing';
    this.log('Running test suite...', 'progress');

    const success = await this.executeCommand('npm test -- --run', 'Test execution');

    if (!success && !this.options.force) {
      throw new Error('Tests failed - aborting deployment');
    }

    return success;
  }

  async runLinting() {
    if (this.options.skipLinting) {
      this.log('Skipping linting (skipLinting option enabled)', 'warning');
      return true;
    }

    this.results.stage = 'linting';
    this.log('Running linting checks...', 'progress');

    const success = await this.executeCommand('npm run lint', 'Linting checks');

    if (!success && !this.options.force) {
      throw new Error('Linting failed - aborting deployment');
    }

    return success;
  }

  async cleanBuild() {
    this.results.stage = 'cleanup';
    this.log('Cleaning previous builds...', 'progress');

    // Clean deploy directory
    if (fs.existsSync(this.deployDir)) {
      execSync(`rm -rf "${this.deployDir}"`, { cwd: rootDir });
    }

    // Clean dist directory if it exists
    if (fs.existsSync(this.buildDir)) {
      execSync(`rm -rf "${this.buildDir}"`, { cwd: rootDir });
    }

    this.log('Build directories cleaned', 'success');
  }

  async performBuild() {
    this.results.stage = 'building';

    if (this.options.environment === 'production') {
      this.log('Running production build with optimizations...', 'progress');
      const success = await this.executeCommand(
        'npm run build:prod',
        'Production build with optimizations'
      );

      if (!success) {
        throw new Error('Production build failed');
      }
    } else {
      this.log('Running development build...', 'progress');
      const success = await this.executeCommand('npm run build', 'Development build');

      if (!success) {
        throw new Error('Build failed');
      }
    }

    return true;
  }

  async analyzeBuild() {
    if (this.options.skipOptimization) {
      this.log('Skipping build analysis (skipOptimization option enabled)', 'warning');
      return;
    }

    this.results.stage = 'analysis';
    this.log('Analyzing build output...', 'progress');

    // Run bundle analysis
    await this.executeCommand('npm run build:analyze', 'Bundle size analysis');

    // Run BundlePhobia-style report
    await this.executeCommand('npm run build:report', 'BundlePhobia analysis');

    // Store metrics in results
    try {
      const deployFiles = fs.readdirSync(this.deployDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => {
          const filePath = path.join(this.deployDir, dirent.name);
          const stats = fs.statSync(filePath);
          return {
            name: dirent.name,
            size: stats.size,
            type: path.extname(dirent.name).slice(1)
          };
        });

      this.results.metrics.build = {
        totalFiles: deployFiles.length,
        totalSize: deployFiles.reduce((sum, file) => sum + file.size, 0),
        files: deployFiles.filter(f => f.type !== 'map'),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log(`Build analysis failed: ${error.message}`, 'warning');
    }
  }

  async generateDeploymentManifest() {
    this.results.stage = 'manifest';
    this.log('Generating deployment manifest...', 'progress');

    const manifest = {
      deployment: {
        id: `deploy-${Date.now()}`,
        timestamp: this.results.timestamp,
        environment: this.options.environment,
        version: this.getVersion()
      },
      build: this.results.metrics.build || {},
      deployment: {
        directory: path.relative(rootDir, this.deployDir),
        files: this.getDeployFiles(),
        checksum: this.generateChecksum()
      },
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        options: this.options
      }
    };

    const manifestPath = path.join(this.deployDir, 'deploy-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    this.log(`Deployment manifest saved: ${manifestPath}`, 'success');
    return manifest;
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(
        path.join(rootDir, 'package.json'), 'utf8'
      ));
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  getDeployFiles() {
    if (!fs.existsSync(this.deployDir)) return [];

    const files = [];
    const scanDirectory = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanDirectory(itemPath, relativeItemPath);
        } else {
          files.push({
            path: relativeItemPath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            type: path.extname(item).slice(1) || 'file'
          });
        }
      }
    };

    scanDirectory(this.deployDir);
    return files;
  }

  generateChecksum() {
    // Simple checksum based on total file size and count
    const files = this.getDeployFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;
    return `${totalSize.toString(36)}-${fileCount.toString(36)}`;
  }

  async optimizeDeployment() {
    this.results.stage = 'optimization';
    this.log('Optimizing deployment...', 'progress');

    // Optimize images if any exist
    const hasImages = fs.existsSync(this.deployDir) &&
                     fs.readdirSync(this.deployDir).some(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f));

    if (hasImages) {
      await this.executeCommand('npm run optimize:images', 'Image optimization');
    }

    // Generate service worker if enabled
    if (this.options.generateServiceWorker) {
      await this.generateServiceWorker();
    }

    this.log('Deployment optimization completed', 'success');
  }

  async generateServiceWorker() {
    const swTemplate = `
const SERVICE_WORKER_VERSION = '${Date.now()}';
const CACHE_NAME = 'printstack-v${SERVICE_WORKER_VERSION}';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
`;

    fs.writeFileSync(path.join(this.deployDir, 'sw.js'), swTemplate.trim());
    this.log('Service worker generated', 'success');
  }

  async runDeploy() {
    const startTime = Date.now();

    try {
      this.log(`Starting deployment to ${this.options.environment} environment`, 'info');

      // Check prerequisites
      await this.checkPrerequisites();

      // Run quality checks
      await this.runTests();
      await this.runLinting();

      // Clean and build
      await this.cleanBuild();
      await this.performBuild();

      // Analyze and optimize
      await this.analyzeBuild();
      await this.optimizeDeployment();

      // Generate artifacts
      const manifest = await this.generateDeploymentManifest();

      const duration = Date.now() - startTime;
      this.log(`Deployment completed successfully in ${Math.round(duration / 1000)}s`, 'success');

      this.results.stage = 'completed';
      this.results.success = true;
      this.results.duration = duration;
      this.results.manifest = manifest;

      return this.results;

    } catch (error) {
      this.results.stage = 'failed';
      this.results.success = false;
      this.results.error = error.message;

      this.log(`Deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  saveResults() {
    const resultsPath = path.join(this.deployDir, 'deployment-results.json');
    if (fs.existsSync(path.dirname(resultsPath))) {
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      this.log(`Deployment results saved: ${resultsPath}`, 'info');
    }
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
      case '--force':
        options.force = true;
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--skip-linting':
        options.skipLinting = true;
        break;
      case '--skip-optimization':
        options.skipOptimization = true;
        break;
      case '--sw':
        options.generateServiceWorker = true;
        break;
      case '--env':
        options.environment = args[++i];
        break;
      case '--help':
        console.log(`
PrintStack Deployment Pipeline

Usage: node scripts/deploy.js [options]

Options:
  --force              Continue deployment even if tests fail or working directory is dirty
  --skip-tests         Skip running test suite
  --skip-linting       Skip linting checks
  --skip-optimization  Skip build optimization and analysis
  --sw                 Generate service worker
  --env <environment>  Target environment (production|development) [default: production]
  --help               Show this help message

Examples:
  node scripts/deploy.js                    # Full production deployment
  node scripts/deploy.js --skip-tests       # Skip tests, deploy to production
  node scripts/deploy.js --env development  # Deploy to development
        `);
        process.exit(0);
    }
  }

  const pipeline = new DeploymentPipeline(options);

  pipeline.runDeploy()
    .then((results) => {
      pipeline.saveResults();

      if (results.success) {
        console.log('\n🎉 Deployment Summary:');
        console.log(`✅ Environment: ${results.environment}`);
        console.log(`✅ Duration: ${Math.round(results.duration / 1000)}s`);
        if (results.metrics.build) {
          console.log(`✅ Build size: ${Math.round(results.metrics.build.totalSize / 1024)}KB`);
          console.log(`✅ Files: ${results.metrics.build.totalFiles}`);
        }
        console.log(`✅ Deploy directory: ${results.directory}`);
        process.exit(0);
      }
    })
    .catch((error) => {
      pipeline.saveResults();
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    });
}

export default DeploymentPipeline;