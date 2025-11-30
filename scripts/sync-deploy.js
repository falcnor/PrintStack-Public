#!/usr/bin/env node

/**
 * Deploy Folder Synchronization Script
 * Handles bidirectional synchronization between development and deploy folders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class DeploySync {
  constructor(options = {}) {
    this.options = {
      force: options.force || false,
      dryRun: options.dryRun || false,
      excludePatterns: options.excludePatterns || [
        '*.log',
        '*.tmp',
        '.DS_Store',
        'Thumbs.db',
        'node_modules',
        '.git',
        '.env',
        'dist'
      ],
      backup: options.backup !== false,
      ...options
    };

    this.srcDir = path.join(rootDir, 'deploy');
    this.targetDir = options.target || path.join(rootDir, 'sync-output');
    this.backupDir = path.join(rootDir, 'backups');
    this.stats = {
      filesScanned: 0,
      filesChanged: 0,
      filesAdded: 0,
      filesRemoved: 0,
      bytesTransferred: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      sync: '🔄',
      add: '➕',
      remove: '➖',
      modify: '📝'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async initialize() {
    this.log('Initializing deployment synchronization...', 'info');

    // Create target directory if it doesn't exist
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
      this.log(`Created target directory: ${this.targetDir}`, 'add');
    }

    // Create backup directory
    if (this.options.backup && !fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Check source directory exists
    if (!fs.existsSync(this.srcDir)) {
      throw new Error(`Source directory not found: ${this.srcDir}`);
    }

    this.log('Synchronization initialized', 'success');
  }

  generateFileHash(filePath) {
    try {
      const data = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      this.log(`Failed to hash file ${filePath}: ${error.message}`, 'error');
      return null;
    }
  }

  shouldExclude(filePath) {
    const fileName = path.basename(filePath);
    return this.options.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName);
    });
  }

  async getFileTree(directory) {
    const files = new Map();

    const scanDir = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);

        if (this.shouldExclude(relativeItemPath)) {
          continue;
        }

        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanDir(itemPath, relativeItemPath);
        } else {
          files.set(relativeItemPath, {
            path: itemPath,
            relativePath,
            size: stats.size,
            modified: stats.mtime,
            hash: this.generateFileHash(itemPath)
          });
          this.stats.filesScanned++;
        }
      }
    };

    scanDir(directory);
    return files;
  }

  async createBackup() {
    if (!this.options.backup) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `sync-backup-${timestamp}`);

    this.log('Creating backup...', 'sync');

    if (!this.options.dryRun) {
      if (fs.existsSync(this.targetDir)) {
        execSync(`cp -r "${this.targetDir}" "${backupPath}"`, { stdio: 'pipe' });
        this.log(`Backup created: ${backupPath}`, 'success');
      }
    } else {
      this.log(`[DRY RUN] Would create backup: ${backupPath}`, 'sync');
    }
  }

  async syncFile(sourceFile, targetPath, operation) {
    const targetFile = path.join(this.targetDir, targetPath);
    const targetDir = path.dirname(targetFile);

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      if (!this.options.dryRun) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }

    const logOperation = () => {
      const size = fs.statSync(sourceFile.path).size;
      this.stats.bytesTransferred += size;

      switch (operation) {
        case 'add':
          this.log(`Added: ${targetPath}`, 'add');
          this.stats.filesAdded++;
          break;
        case 'modify':
          this.log(`Modified: ${targetPath}`, 'modify');
          this.stats.filesChanged++;
          break;
        case 'remove':
          this.log(`Removed: ${targetPath}`, 'remove');
          this.stats.filesRemoved++;
          break;
      }
    };

    try {
      switch (operation) {
        case 'add':
        case 'modify':
          if (!this.options.dryRun) {
            fs.copyFileSync(sourceFile.path, targetFile);

            // Preserve file permissions
            const sourceStats = fs.statSync(sourceFile.path);
            fs.chmodSync(targetFile, sourceStats.mode);
          }
          logOperation();
          break;

        case 'remove':
          if (!this.options.dryRun) {
            fs.unlinkSync(targetFile);

            // Try to remove empty directories
            this.cleanupEmptyDirs(targetDir);
          }
          logOperation();
          break;
      }

      return true;
    } catch (error) {
      const errorMsg = `Failed to ${operation} file ${targetPath}: ${error.message}`;
      this.log(errorMsg, 'error');
      this.stats.errors.push(errorMsg);
      return false;
    }
  }

  cleanupEmptyDirs(dir, rootDir = this.targetDir) {
    try {
      // Don't remove the root directory
      if (path.resolve(dir) === path.resolve(rootDir)) return;

      const items = fs.readdirSync(dir);
      if (items.length === 0) {
        fs.rmdirSync(dir);
        // Recursively check parent directory
        this.cleanupEmptyDirs(path.dirname(dir), rootDir);
      }
    } catch (error) {
      // Directory might not exist or can't be removed, ignore
    }
  }

  async synchronize() {
    this.log('Starting synchronization...', 'sync');

    await this.initialize();
    await this.createBackup();

    const sourceFiles = await this.getFileTree(this.srcDir);
    let targetFiles;

    if (fs.existsSync(this.targetDir)) {
      targetFiles = await this.getFileTree(this.targetDir);
    } else {
      targetFiles = new Map();
    }

    // Find files to add or modify
    for (const [relativePath, sourceFile] of sourceFiles.entries()) {
      const targetFile = targetFiles.get(relativePath);

      if (!targetFile) {
        // New file
        await this.syncFile(sourceFile, relativePath, 'add');
      } else if (targetFile && sourceFile.hash !== targetFile.hash) {
        // Modified file
        await this.syncFile(sourceFile, relativePath, 'modify');
      }
    }

    // Find files to remove
    for (const [relativePath] of targetFiles.entries()) {
      if (!sourceFiles.has(relativePath)) {
        const mockSourceFile = { path: '', hash: null };
        await this.syncFile(mockSourceFile, relativePath, 'remove');
      }
    }

    // Finalize synchronization
    this.finalizeSync();
  }

  finalizeSync() {
    // Create sync manifest
    const manifest = {
      syncTime: new Date().toISOString(),
      sourceDir: path.relative(rootDir, this.srcDir),
      targetDir: this.options.target || 'sync-output',
      options: this.options,
      stats: {
        ...this.stats,
        bytesTransferredHuman: this.formatBytes(this.stats.bytesTransferred)
      },
      files: {
        scanned: this.stats.filesScanned,
        changed: this.stats.filesChanged,
        added: this.stats.filesAdded,
        removed: this.stats.filesRemoved
      }
    };

    const manifestPath = path.join(this.targetDir, 'sync-manifest.json');
    if (!this.options.dryRun) {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      this.log(`Sync manifest created: ${manifestPath}`, 'success');
    }

    // Log summary
    this.log('\n📊 Synchronization Summary:', 'info');
    this.log(`  Files scanned: ${this.stats.filesScanned}`, 'info');
    this.log(`  Files added: ${this.stats.filesAdded}`, 'success');
    this.log(`  Files modified: ${this.stats.filesChanged}`, 'modify');
    this.log(`  Files removed: ${this.stats.filesRemoved}`, 'remove');
    this.log(`  Data transferred: ${this.formatBytes(this.stats.bytesTransferred)}`, 'success');
    this.log(`  Errors: ${this.stats.errors.length}`, this.stats.errors.length > 0 ? 'warning' : 'success');

    if (this.stats.errors.length > 0) {
      this.log('\n❌ Errors encountered:', 'error');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    this.log(this.options.dryRun ? '\n🔍 DRY RUN COMPLETED' : '\n✅ SYNCHRONIZATION COMPLETED', 'success');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async watchForChanges() {
    this.log('Starting file watcher for real-time sync...', 'sync');

    const chokidar = require('chokidar'); // Note: would need to install this dependency

    const watcher = chokidar.watch(this.srcDir, {
      ignored: this.options.excludePatterns,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      const relativePath = path.relative(this.srcDir, filePath);
      const sourceFile = {
        path: filePath,
        relativePath,
        hash: this.generateFileHash(filePath)
      };

      this.log(`File changed: ${relativePath}`, 'modify');
      await this.syncFile(sourceFile, relativePath, 'modify');
    });

    watcher.on('add', async (filePath) => {
      const relativePath = path.relative(this.srcDir, filePath);
      const sourceFile = {
        path: filePath,
        relativePath,
        hash: this.generateFileHash(filePath)
      };

      this.log(`File added: ${relativePath}`, 'add');
      await this.syncFile(sourceFile, relativePath, 'add');
    });

    watcher.on('unlink', async (filePath) => {
      const relativePath = path.relative(this.srcDir, filePath);
      const mockSourceFile = { path: '', hash: null };

      this.log(`File removed: ${relativePath}`, 'remove');
      await this.syncFile(mockSourceFile, relativePath, 'remove');
    });

    this.log('File watcher active. Press Ctrl+C to stop.', 'info');

    process.on('SIGINT', () => {
      this.log('Stopping file watcher...', 'info');
      watcher.close();
      process.exit(0);
    });
  }

  async run() {
    try {
      if (this.options.watch) {
        await this.watchForChanges();
      } else {
        await this.synchronize();
      }
    } catch (error) {
      this.log(`Synchronization failed: ${error.message}`, 'error');
      process.exit(1);
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
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--target':
        options.target = args[++i];
        break;
      case '--help':
        console.log(`
Deploy Folder Synchronization Tool

Usage: node scripts/sync-deploy.js [options]

Options:
  --force            Force sync even without confirmation
  --dry-run          Show what would be synced without making changes
  --no-backup        Skip creating backup before sync
  --watch            Watch for changes and sync in real-time
  --target <dir>     Target directory to sync to [default: sync-output]
  --help             Show this help message

Examples:
  node scripts/sync-deploy.js                    # One-way sync to sync-output
  node scripts/sync-deploy.js --dry-run          # Preview sync without making changes
  node scripts/sync-deploy.js --target /var/www  # Sync to web server directory
  node scripts/sync-deploy.js --watch            # Real-time sync while developing
        `);
        process.exit(0);
    }
  }

  const sync = new DeploySync(options);
  sync.run();
}

export default DeploySync;