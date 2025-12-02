#!/usr/bin/env node

/**
 * Uptime Monitoring Script for PrintStack
 *
 * This script monitors the availability and performance of deployed PrintStack instances.
 * It can be run manually, scheduled via cron, or integrated into CI/CD pipelines.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_PATH = path.join(__dirname, 'uptime-config.json');
const LOG_PATH = path.join(__dirname, 'uptime.log');
const METRICS_PATH = path.join(__dirname, 'metrics.json');

let config;
let metrics = {
  checks: [],
  alerts: [],
  summary: {
    total_checks: 0,
    successful_checks: 0,
    failed_checks: 0,
    average_response_time: 0
  }
};

// Load configuration
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ Configuration loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load configuration:', error.message);
    process.exit(1);
  }
}

// HTTP request function
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const startTime = Date.now();

    const requestOptions = {
      method: options.method || 'GET',
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': 'PrintStack-Uptime-Monitor/1.0',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        resolve({
          status: res.statusCode,
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

// Check single endpoint
async function checkEndpoint(endpoint) {
  const startTime = new Date();

  try {
    console.log(`🔍 Checking ${endpoint.name}: ${endpoint.url}`);

    const result = await makeRequest(endpoint.url, {
      timeout: endpoint.timeout || 10000,
      method: endpoint.method || 'GET'
    });

    const checkData = {
      timestamp: startTime.toISOString(),
      endpoint: endpoint.name,
      url: endpoint.url,
      status: result.status,
      responseTime: result.responseTime,
      success: result.success,
      data: result.data.substring(0, 500) // Limit data length
    };

    // Add performance analysis
    checkData.performance = analyzePerformance(result.responseTime, endpoint);

    // Log result
    if (result.success) {
      console.log(`✅ ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
    }

    return checkData;

  } catch (error) {
    const endTime = Date.now();
    const checkData = {
      timestamp: startTime.toISOString(),
      endpoint: endpoint.name,
      url: endpoint.url,
      status: 0,
      responseTime: endTime - startTime,
      success: false,
      error: error.message
    };

    console.log(`💥 ${endpoint.name}: Error - ${error.message}`);
    return checkData;
  }
}

// Analyze performance against thresholds
function analyzePerformance(responseTime, endpoint) {
  const thresholds = endpoint.alerts?.response_time_threshold || 3000;
  const rating = responseTime <= thresholds * 0.5 ? 'excellent' :
                 responseTime <= thresholds * 0.8 ? 'good' :
                 responseTime <= thresholds ? 'acceptable' : 'poor';

  return {
    responseTime: responseTime,
    threshold: thresholds,
    rating: rating,
    withinThreshold: responseTime <= thresholds
  };
}

// Run all endpoint checks
async function runChecks() {
  console.log('🚀 Starting uptime monitoring checks...');

  if (!config || !config.endpoints) {
    throw new Error('Invalid configuration');
  }

  const results = [];

  for (const endpoint of config.endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);

    // Add small delay between checks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update metrics
  results.forEach(result => metrics.checks.push(result));
  metrics.summary.total_checks += results.length;
  metrics.summary.successful_checks += results.filter(r => r.success).length;
  metrics.summary.failed_checks += results.filter(r => !r.success).length;

  // Calculate average response time
  const totalResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0);
  metrics.summary.average_response_time = Math.round(totalResponseTime / results.length);

  // Check for alerts
  checkForAlerts(results);

  return results;
}

// Check for alert conditions
function checkForAlerts(results) {
  results.forEach(result => {
    if (!result.success) {
      const alert = {
        timestamp: new Date().toISOString(),
        type: 'endpoint_failure',
        endpoint: result.endpoint,
        message: `Endpoint ${result.endpoint} is down or not responding`,
        severity: 'high'
      };

      metrics.alerts.push(alert);
      console.log(`🚨 ALERT: ${alert.message}`);
    }

    if (result.performance && !result.performance.withinThreshold) {
      const alert = {
        timestamp: new Date().toISOString(),
        type: 'performance_degradation',
        endpoint: result.endpoint,
        message: `Endpoint ${result.endpoint} response time (${result.responseTime}ms) exceeds threshold (${result.performance.threshold}ms)`,
        severity: 'medium'
      };

      metrics.alerts.push(alert);
      console.log(`⚠️ ALERT: ${alert.message}`);
    }
  });
}

// Save metrics to file
function saveMetrics() {
  try {
    // Keep only last 1000 checks
    if (metrics.checks.length > 1000) {
      metrics.checks = metrics.checks.slice(-1000);
    }

    // Keep only last 100 alerts
    if (metrics.alerts.length > 100) {
      metrics.alerts = metrics.alerts.slice(-100);
    }

    fs.writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 2));
    console.log('💾 Metrics saved to', METRICS_PATH);
  } catch (error) {
    console.error('❌ Failed to save metrics:', error.message);
  }
}

// Generate report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: metrics.summary,
    recentChecks: metrics.checks.slice(-10),
    recentAlerts: metrics.alerts.slice(-5),
    endpointStatus: {}
  };

  // Calculate endpoint status
  config.endpoints.forEach(endpoint => {
    const endpointChecks = metrics.checks.filter(c => c.endpoint === endpoint.name);
    const recentChecks = endpointChecks.slice(-5); // Last 5 checks

    const successRate = recentChecks.length > 0
      ? (recentChecks.filter(c => c.success).length / recentChecks.length) * 100
      : 0;

    report.endpointStatus[endpoint.name] = {
      status: successRate >= 80 ? 'healthy' : successRate >= 50 ? 'degraded' : 'down',
      successRate: successRate.toFixed(1),
      recentChecks: recentChecks.length,
      averageResponseTime: recentChecks.length > 0
        ? Math.round(recentChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / recentChecks.length)
        : 0
    };
  });

  return report;
}

// Log to file
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(LOG_PATH, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

// Main execution
async function main() {
  console.log('PrintStack Uptime Monitor v1.0');
  console.log('================================');

  try {
    // Load configuration
    loadConfig();

    // Check if this is a one-time run or continuous monitoring
    const isContinuous = process.argv.includes('--continuous') || process.argv.includes('-c');

    if (isContinuous) {
      console.log('🔄 Starting continuous monitoring (Ctrl+C to stop)');

      const interval = parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 60000; // Default 1 minute

      const monitor = async () => {
        try {
          const results = await runChecks();
          saveMetrics();

          const report = generateReport();
          console.log('\n📊 Monitoring Summary:');
          console.log(`Total checks: ${report.summary.total_checks}`);
          console.log(`Success rate: ${((report.summary.successful_checks / report.summary.total_checks) * 100).toFixed(1)}%`);
          console.log(`Average response time: ${report.summary.average_response_time}ms`);
          console.log(`Active alerts: ${report.recentAlerts.length}`);

          logToFile(`Monitoring cycle completed. Success rate: ${((report.summary.successful_checks / report.summary.total_checks) * 100).toFixed(1)}%`);

        } catch (error) {
          console.error('❌ Monitoring cycle failed:', error.message);
          logToFile(`ERROR: ${error.message}`);
        }
      };

      // Run immediately
      await monitor();

      // Set up interval
      setInterval(monitor, interval);

    } else {
      // One-time run
      const results = await runChecks();
      saveMetrics();

      const report = generateReport();
      console.log('\n📊 Final Report:');
      console.log(JSON.stringify(report, null, 2));

      // Exit with error code if there are failures
      const failuresCount = results.filter(r => !r.success).length;
      if (failuresCount > 0) {
        console.log(`\n❌ ${failuresCount} endpoint(s) failed`);
        process.exit(1);
      } else {
        console.log('\n✅ All endpoints healthy');
        process.exit(0);
      }
    }

  } catch (error) {
    console.error('❌ Uptime monitor failed:', error.message);
    logToFile(`FATAL ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down uptime monitor...');
  saveMetrics();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down uptime monitor...');
  saveMetrics();
  process.exit(0);
});

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEndpoint,
  runChecks,
  generateReport,
  loadConfig
};