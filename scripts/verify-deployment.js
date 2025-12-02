#!/usr/bin/env node

/**
 * Deployment Verification Script for PrintStack
 *
 * This script verifies that a deployment was successful by checking:
 * - Site accessibility
 * - Core functionality
 * - Performance metrics
 * - Security headers
 * - File integrity
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  expectedHeaders: [
    { name: 'x-frame-options', expected: 'DENY' },
    { name: 'x-content-type-options', expected: 'nosniff' },
    { name: 'strict-transport-security', pattern: /max-age=/ }
  ],
  criticalPaths: [
    '/',
    '/manifest.json',
    '/api/health.json'
  ],
  performanceThresholds: {
    ttfb: 2000, // Time to First Byte
    domLoad: 3000, // DOM Load Time
    pageLoad: 5000 // Full Page Load Time
  }
};

// Verification results
let verificationResults = {
  deployment: {
    url: '',
    status: 'pending',
    timestamp: new Date().toISOString(),
    duration: 0
  },
  accessibility: {},
  functionality: {},
  performance: {},
  security: {},
  integrity: {},
  overall: 'pending'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    url: '',
    environment: 'production',
    verbose: false,
    strict: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--url':
      case '-u':
        config.url = args[++i];
        break;
      case '--environment':
      case '-e':
        config.environment = args[++i];
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--strict':
      case '-s':
        config.strict = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  if (!config.url) {
    console.error('❌ Error: Deployment URL is required');
    console.error('Usage: node verify-deployment.js --url <url> [options]');
    console.error('Use --help for more information');
    process.exit(1);
  }

  return config;
}

// Show help
function showHelp() {
  console.log(`
PrintStack Deployment Verification Script

USAGE:
  node verify-deployment.js --url <url> [options]

REQUIRED:
  --url, -u <url>           Deployed URL to verify

OPTIONS:
  --environment, -e <env>   Environment (development|production) [default: production]
  --verbose, -v             Enable verbose output
  --strict, -s             Enable strict mode (fail on any issue)
  --help, -h               Show this help message

EXAMPLES:
  node verify-deployment.js --url https://printstack-prod.web.app
  node verify-deployment.js --url https://printstack-dev.web.app --environment development --verbose
  node verify-deployment.js --url https://example.web.app --strict

EXIT CODES:
  0  Success
  1  Critical failure
  2  Non-critical issues detected (strict mode)
`);
}

// HTTP request function with retries
async function makeRequest(url, options = {}) {
  const maxAttempts = options.retryAttempts || CONFIG.retryAttempts;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (options.verbose && attempt > 1) {
        console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} for ${url}`);
      }

      const result = await performRequest(url, options);
      return result;

    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      if (options.verbose) {
        console.log(`⏳ Waiting ${CONFIG.retryDelay}ms before retry...`);
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
}

// Perform actual HTTP request
function performRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const startTime = Date.now();

    const requestOptions = {
      method: options.method || 'GET',
      timeout: options.timeout || CONFIG.timeout,
      headers: {
        'User-Agent': 'PrintStack-Deployment-Verifier/1.0',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      const responseTime = Date.now() - startTime;

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data,
          responseTime: responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Verify site accessibility
async function verifyAccessibility(url) {
  console.log('🔍 Verifying site accessibility...');

  const results = {
    status: 'pending',
    checks: {}
  };

  try {
    // Check main URL
    const mainResult = await makeRequest(url, { verbose: config.verbose });
    results.checks.main = {
      url: url,
      status: mainResult.success ? 'pass' : 'fail',
      statusCode: mainResult.status,
      responseTime: mainResult.responseTime,
      error: mainResult.success ? null : 'Request failed'
    };

    if (!mainResult.success) {
      results.status = 'critical';
      return results;
    }

    // Check critical paths
    for (const path of CONFIG.criticalPaths) {
      const fullUrl = url + path;
      try {
        const result = await makeRequest(fullUrl, { verbose: config.verbose });
        results.checks[path] = {
          url: fullUrl,
          status: result.success ? 'pass' : 'fail',
          statusCode: result.status,
          responseTime: result.responseTime
        };
      } catch (error) {
        results.checks[path] = {
          url: fullUrl,
          status: 'fail',
          error: error.message
        };
      }
    }

    // Determine overall accessibility status
    const failedChecks = Object.values(results.checks).filter(check => check.status === 'fail');
    if (failedChecks.length === 0) {
      results.status = 'pass';
    } else if (failedChecks.length === 1 && failedChecks[0].url === url + '/api/health.json') {
      results.status = 'warning'; // Health endpoint might not exist yet
    } else {
      results.status = 'critical';
    }

  } catch (error) {
    results.status = 'critical';
    results.error = error.message;
  }

  return results;
}

// Verify core functionality
async function verifyFunctionality(url) {
  console.log('🧪 Verifying core functionality...');

  const results = {
    status: 'pending',
    checks: {}
  };

  try {
    // Check if page loads without JavaScript errors (via content analysis)
    const result = await makeRequest(url, { verbose: config.verbose });

    if (result.success) {
      // Check for critical elements in the HTML
      const hasTitle = result.data.includes('<title>');
      const hasReactRoot = result.data.includes('id="root"');
      const hasPrintStackText = result.data.toLowerCase().includes('printstack');
      const hasFavicon = result.data.includes('rel="icon"');

      results.checks.htmlStructure = {
        status: hasTitle && hasReactRoot ? 'pass' : 'fail',
        hasTitle,
        hasReactRoot,
        hasPrintStackText,
        hasFavicon
      };

      // Check for JavaScript bundles
      const hasJSBundle = result.data.includes('src="/src/') || result.data.includes('src="/assets/');
      results.checks.javascriptBundle = {
        status: hasJSBundle ? 'pass' : 'fail',
        found: hasJSBundle
      };

      // Check for CSS
      const hasCSS = result.data.includes('<style') || result.data.includes('rel="stylesheet"');
      results.checks.styling = {
        status: hasCSS ? 'pass' : 'warning',
        found: hasCSS
      };

      // Check for manifest
      const manifestCheck = results.checks['/manifest.json'];
      results.checks.manifest = {
        status: manifestCheck && manifestCheck.status === 'pass' ? 'pass' : 'warning',
        available: manifestCheck && manifestCheck.status === 'pass'
      };

    } else {
      results.status = 'critical';
      results.error = 'Cannot verify functionality - main page failed to load';
      return results;
    }

    // Determine overall functionality status
    const criticalFailures = Object.values(results.checks).filter(check => check.status === 'fail');
    const warnings = Object.values(results.checks).filter(check => check.status === 'warning');

    if (criticalFailures.length === 0) {
      results.status = warnings.length > 0 ? 'warning' : 'pass';
    } else {
      results.status = 'critical';
    }

  } catch (error) {
    results.status = 'critical';
    results.error = error.message;
  }

  return results;
}

// Verify performance metrics
async function verifyPerformance(url) {
  console.log('⚡ Verifying performance metrics...');

  const results = {
    status: 'pending',
    checks: {},
    metrics: {}
  };

  try {
    // Check Time to First Byte
    const result = await makeRequest(url, { verbose: config.verbose });

    if (result.success) {
      results.metrics.ttfb = result.responseTime;
      results.checks.ttfb = {
        status: result.responseTime <= CONFIG.performanceThresholds.ttfb ? 'pass' : 'fail',
        value: result.responseTime,
        threshold: CONFIG.performanceThresholds.ttfb
      };

      // Simple performance estimation based on response patterns
      // In a real scenario, you'd use tools like Lighthouse API
      results.estimated = {
        pageLoad: estimatePageLoad(result.data, result.responseTime),
        resourceCount: estimateResourceCount(result.data)
      };

      results.checks.pageLoadEstimate = {
        status: results.estimated.pageLoad <= CONFIG.performanceThresholds.pageLoad ? 'pass' : 'fail',
        estimated: results.estimated.pageLoad,
        threshold: CONFIG.performanceThresholds.pageLoad
      };

    } else {
      results.status = 'critical';
      results.error = 'Cannot measure performance - request failed';
      return results;
    }

    // Determine overall performance status
    const failures = Object.values(results.checks).filter(check => check.status === 'fail');
    results.status = failures.length === 0 ? 'pass' : 'warning';

  } catch (error) {
    results.status = 'critical';
    results.error = error.message;
  }

  return results;
}

// Verify security headers
async function verifySecurity(url) {
  console.log('🔒 Verifying security headers...');

  const results = {
    status: 'pending',
    checks: {}
  };

  try {
    const result = await makeRequest(url, { verbose: config.verbose });

    if (result.success) {
      // Check expected security headers
      CONFIG.expectedHeaders.forEach(header => {
        const headerValue = result.headers[header.name.toLowerCase()];

        if (headerValue) {
          if (header.expected) {
            results.checks[header.name] = {
              status: headerValue === header.expected ? 'pass' : 'fail',
              expected: header.expected,
              actual: headerValue
            };
          } else if (header.pattern) {
            results.checks[header.name] = {
              status: header.pattern.test(headerValue) ? 'pass' : 'warning',
              actual: headerValue,
              pattern: header.pattern.toString()
            };
          }
        } else {
          results.checks[header.name] = {
            status: config.strict ? 'fail' : 'warning',
            expected: header.expected || 'pattern match',
            actual: 'missing'
          };
        }
      });

      // Check CSP header
      const csp = result.headers['content-security-policy'];
      results.checks.csp = {
        status: csp ? 'pass' : (config.strict ? 'fail' : 'warning'),
        present: !!csp,
        value: csp?.substring(0, 100) + (csp?.length > 100 ? '...' : '')
      };

    } else {
      results.status = 'critical';
      results.error = 'Cannot verify security - request failed';
      return results;
    }

    // Determine overall security status
    const failures = Object.values(results.checks).filter(check => check.status === 'fail');
    const warnings = Object.values(results.checks).filter(check => check.status === 'warning');

    if (failures.length === 0) {
      results.status = warnings.length > 0 ? 'warning' : 'pass';
    } else {
      results.status = config.strict ? 'critical' : 'warning';
    }

  } catch (error) {
    results.status = 'critical';
    results.error = error.message;
  }

  return results;
}

// Verify file integrity
async function verifyIntegrity(url) {
  console.log('📦 Verifying file integrity...');

  const results = {
    status: 'pending',
    checks: {}
  };

  try {
    const result = await makeRequest(url, { verbose: config.verbose });

    if (result.success) {
      // Check for critical files
      const criticalFiles = [
        { name: 'HTML Structure', pattern: /<!DOCTYPE html>/ },
        { name: 'React Root', pattern: /id="root"/ },
        { name: 'Main Script', pattern: /src="\/[^"]*\.(js|jsx)"/ },
        { name: 'Meta Tags', pattern: /<meta[^>]*charset/ }
      ];

      criticalFiles.forEach(file => {
        const found = file.pattern.test(result.data);
        results.checks[file.name] = {
          status: found ? 'pass' : 'fail',
          found
        };
      });

      // Check file size indicators
      results.metrics.htmlSize = result.data.length;
      results.checks.htmlSize = {
        status: result.data.length > 1000 && result.data.length < 500000 ? 'pass' : 'warning',
        size: result.data.length
      };

    } else {
      results.status = 'critical';
      results.error = 'Cannot verify integrity - request failed';
      return results;
    }

    // Determine overall integrity status
    const failures = Object.values(results.checks).filter(check => check.status === 'fail');
    results.status = failures.length === 0 ? 'pass' : 'warning';

  } catch (error) {
    results.status = 'critical';
    results.error = error.message;
  }

  return results;
}

// Estimate page load time (simplified)
function estimatePageLoad(htmlContent, ttfb) {
  // This is a very rough estimate
  const hasScripts = (htmlContent.match(/<script/g) || []).length;
  const hasStyles = (htmlContent.match(/<link[^>]*stylesheet/g) || []).length;
  const hasImages = (htmlContent.match(/<img/g) || []).length;

  const estimatedResourceLoad = Math.min(
    hasScripts * 200 + hasStyles * 100 + hasImages * 300,
    2000
  );

  return ttfb + estimatedResourceLoad;
}

// Estimate resource count
function estimateResourceCount(htmlContent) {
  const scripts = (htmlContent.match(/<script/g) || []).length;
  const styles = (htmlContent.match(/<link[^>]*stylesheet/g) || []).length;
  const images = (htmlContent.match(/<img/g) || []).length;

  return { scripts, styles, images, total: scripts + styles + images };
}

// Generate verification report
function generateReport() {
  const startTime = Date.now();

  // Calculate overall status
  const criticalSections = ['accessibility', 'functionality'];
  const fails = criticalSections.filter(section =>
    verificationResults[section].status === 'critical'
  );

  const warnings = Object.values(verificationResults)
    .filter(result => typeof result === 'object' && result.status)
    .filter(result => result.status === 'warning').length;

  verificationResults.overall = fails.length > 0 ? 'critical' :
                               warnings > 0 ? 'warning' : 'pass';

  verificationResults.deployment.duration = Date.now() - startTime;

  return {
    ...verificationResults,
    summary: {
      overall: verificationResults.overall,
      criticalIssues: fails.length,
      warnings: warnings,
      duration: verificationResults.deployment.duration
    }
  };
}

// Print verification results
function printResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`URL: ${verificationResults.deployment.url}`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Status: ${results.summary.overall.toUpperCase()}`);
  console.log(`Duration: ${results.summary.duration}ms`);
  console.log(`Timestamp: ${verificationResults.deployment.timestamp}`);

  // Print detailed results
  const sections = ['accessibility', 'functionality', 'performance', 'security', 'integrity'];

  sections.forEach(section => {
    const sectionResult = verificationResults[section];
    if (!sectionResult || !sectionResult.status) return;

    console.log(`\n🔹 ${section.toUpperCase()}: ${sectionResult.status.toUpperCase()}`);

    if (sectionResult.error) {
      console.log(`   ❌ Error: ${sectionResult.error}`);
    }

    if (sectionResult.checks) {
      Object.entries(sectionResult.checks).forEach(([check, result]) => {
        const status = result.status === 'pass' ? '✅' :
                      result.status === 'fail' ? '❌' : '⚠️';
        console.log(`   ${status} ${check}: ${result.status}`);

        if (result.value !== undefined) {
          console.log(`      Value: ${result.value}${result.threshold ? ` (threshold: ${result.threshold})` : ''}`);
        }

        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
    }

    if (sectionResult.metrics) {
      Object.entries(sectionResult.metrics).forEach(([metric, value]) => {
        console.log(`   📈 ${metric}: ${value}`);
      });
    }
  });

  console.log('\n' + '='.repeat(60));

  // Print summary
  switch (results.summary.overall) {
    case 'pass':
      console.log('✅ DEPLOYMENT VERIFICATION PASSED');
      console.log('   Your deployment is healthy and ready for production!');
      break;
    case 'warning':
      console.log('⚠️ DEPLOYMENT VERIFICATION COMPLETED WITH WARNINGS');
      console.log('   Deployment is functional but may need attention.');
      break;
    case 'critical':
      console.log('❌ DEPLOYMENT VERIFICATION FAILED');
      console.log('   Critical issues detected. Deployment may need rollback.');
      break;
  }

  console.log('='.repeat(60) + '\n');
}

// Main verification function
async function verifyDeployment(config) {
  const startTime = Date.now();

  console.log(`🚀 Starting deployment verification for ${config.url}`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Strict mode: ${config.strict}`);

  verificationResults.deployment.url = config.url;

  try {
    // Run all verifications
    verificationResults.accessibility = await verifyAccessibility(config.url);
    verificationResults.functionality = await verifyFunctionality(config.url);
    verificationResults.performance = await verifyPerformance(config.url);
    verificationResults.security = await verifySecurity(config.url);
    verificationResults.integrity = await verifyIntegrity(config.url);

    // Generate and print report
    const report = generateReport();
    printResults(report);

    // Save report to file
    const reportPath = `deployment-verification-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    switch (report.summary.overall) {
      case 'pass':
        process.exit(0);
      case 'warning':
        process.exit(config.strict ? 2 : 0);
      case 'critical':
        process.exit(1);
    }

  } catch (error) {
    console.error(`💥 Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse arguments and run
const config = parseArgs();

if (require.main === module) {
  verifyDeployment(config);
}

module.exports = {
  verifyDeployment,
  verifyAccessibility,
  verifyFunctionality,
  verifyPerformance,
  verifySecurity,
  verifyIntegrity
};