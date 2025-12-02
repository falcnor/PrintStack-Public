#!/usr/bin/env node

/**
 * Custom Domain Setup Script for PrintStack
 *
 * This script automates the setup of custom domains for Firebase Hosting,
 * including DNS configuration, SSL setup, and redirects.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projects: {
    prod: 'printstack-prod',
    dev: 'printstack-dev'
  },
  firebaseHostingIPs: [
    '192.168.0.1',
    '192.168.0.2'  // These are placeholders - get real IPs from Firebase
  ]
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    domain: '',
    environment: 'prod',
    project: '',
    dryRun: false,
    force: false,
    generateDNS: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--domain':
      case '-d':
        config.domain = args[++i];
        break;
      case '--environment':
      case '-e':
        config.environment = args[++i];
        break;
      case '--project':
      case '-p':
        config.project = args[++i];
        break;
      case '--dry-run':
      case '-n':
        config.dryRun = true;
        break;
      case '--force':
      case '-f':
        config.force = true;
        break;
      case '--generate-dns':
      case '-g':
        config.generateDNS = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  if (!config.domain) {
    console.error('❌ Error: Domain is required');
    console.error('Usage: node setup-custom-domain.js --domain <domain> [options]');
    console.error('Use --help for more information');
    process.exit(1);
  }

  config.project = config.project || CONFIG.projects[config.environment];

  return config;
}

// Show help
function showHelp() {
  console.log(`
PrintStack Custom Domain Setup Script

USAGE:
  node setup-custom-domain.js --domain <domain> [options]

REQUIRED:
  --domain, -d <domain>       Custom domain to set up

OPTIONS:
  --environment, -e <env>     Environment (prod|dev) [default: prod]
  --project, -p <project>     Firebase project ID [default: based on environment]
  --dry-run, -n              Show commands without executing them
  --force, -f                Force overwrite existing configuration
  --generate-dns, -g         Generate DNS configuration file
  --help, -h                 Show this help message

EXAMPLES:
  node setup-custom-domain.js --domain printstack.com
  node setup-custom-domain.js --domain app.printstack.com --environment prod
  node setup-custom-domain.js --domain dev.printstack.com --environment dev --dry-run
  node setup-custom-domain.js --domain staging.printstack.com --generate-dns

ENVIRONMENTS:
  prod  - Production (printstack-prod)
  dev   - Development (printstack-dev)

OUTPUT FILES:
  - firebase-domain-<domain>.json  (domain configuration)
  - dns-records-<domain>.txt       (DNS records)
  - domain-health-check.json       (health check configuration)
`);
}

// Validate domain format
function validateDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

// Generate DNS configuration
function generateDNSConfig(domain, config) {
  const isSubdomain = domain.includes('.');
  const baseDomain = domain.split('.').slice(-2).join('.');
  const subdomain = domain.replace(baseDomain, '').replace(/\.$/, '');

  const dnsConfig = {
    domain: domain,
    baseDomain: baseDomain,
    isSubdomain: isSubdomain,
    records: {
      verification: {
        type: 'TXT',
        name: isSubdomain ? `_firebase-domain-verification.${subdomain}` : '@',
        value: 'await-firebase-verification-code'
      },
      hosting: {
        type: 'A',
        name: isSubdomain ? subdomain : '@',
        values: CONFIG.firebaseHostingIPs
      }
    }
  };

  // Add www redirect if root domain
  if (!isSubdomain) {
    dnsConfig.records.www = {
      type: 'A',
      name: 'www',
      values: CONFIG.firebaseHostingIPs
    };
  }

  // Add CNAME for alternative configurations
  if (isSubdomain && subdomain !== 'www') {
    dnsConfig.records.www = {
      type: 'CNAME',
      name: 'www',
      value: domain
    };
  }

  return dnsConfig;
}

// Update Firebase configuration
function updateFirebaseConfig(domain, config) {
  const firebaseConfigPath = 'firebase.json';

  if (!fs.existsSync(firebaseConfigPath)) {
    console.log('⚠️ firebase.json not found, creating new configuration');
    return;
  }

  let firebaseConfig;
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  } catch (error) {
    console.error('❌ Error reading firebase.json:', error.message);
    return;
  }

  // Add domain redirects
  if (!firebaseConfig.hosting.redirects) {
    firebaseConfig.hosting.redirects = [];
  }

  // Add required redirects
  const redirects = [
    {
      source: `http://${domain}`,
      destination: `https://${domain}`,
      type: 301
    }
  ];

  // Add www redirect
  const hasWWW = !domain.startsWith('www.');
  if (hasWWW) {
    redirects.push({
      source: `https://www.${domain}`,
      destination: `https://${domain}`,
      type: 301
    });
  }

  // Add redirects to firebase.json
  redirects.forEach(redirect => {
    const exists = firebaseConfig.hosting.redirects.some(
      r => r.source === redirect.source
    );

    if (!exists || config.force) {
      if (exists && config.force) {
        // Remove existing redirect
        firebaseConfig.hosting.redirects = firebaseConfig.hosting.redirects.filter(
          r => r.source !== redirect.source
        );
      }

      firebaseConfig.hosting.redirects.push(redirect);
      console.log(`✅ Added redirect: ${redirect.source} → ${redirect.destination}`);
    }
  });

  // Write updated configuration
  if (!config.dryRun) {
    try {
      fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
      console.log('✅ Updated firebase.json');
    } catch (error) {
      console.error('❌ Error updating firebase.json:', error.message);
    }
  }
}

// Generate domain deployment configuration
function generateDomainConfig(domain, config) {
  const domainConfigPath = `firebase-domain-${domain.replace(/\./g, '-')}.json`;

  const domainConfig = {
    domain: domain,
    environment: config.environment,
    project: config.project,
    firebaseConfig: {
      hosting: {
        site: config.project,
        public: 'dist',
        redirects: [
          {
            source: `http://${domain}`,
            destination: `https://${domain}`,
            type: 301
          },
          {
            source: `https://www.${domain}`,
            destination: `https://${domain}`,
            type: 301
          }
        ],
        cleanUrls: true,
        trailingSlash: false,
        headers: [
          {
            source: '**',
            headers: [
              {
                key: 'X-Frame-Options',
                value: 'DENY'
              },
              {
                key: 'X-Content-Type-Options',
                value: 'nosniff'
              },
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains; preload'
              }
            ]
          }
        ]
      }
    },
    commands: {
      addDomain: `firebase hosting:sites:${config.project}:domains:add ${domain}`,
      checkSSL: `firebase hosting:sites:${config.project}:domains:${domain}:ssl:get-status`,
      renewSSL: `firebase hosting:sites:${config.project}:domains:${domain}:ssl:renew`,
      listDomains: `firebase hosting:sites:${config.project}:domains:list`
    },
    createdAt: new Date().toISOString()
  };

  if (!config.dryRun) {
    try {
      fs.writeFileSync(domainConfigPath, JSON.stringify(domainConfig, null, 2));
      console.log(`✅ Created domain configuration: ${domainConfigPath}`);
    } catch (error) {
      console.error(`❌ Error creating domain configuration:`, error.message);
    }
  }

  return domainConfig;
}

// Generate DNS records file
function generateDNSRecords(dnsConfig, config) {
  const dnsPath = `dns-records-${dnsConfig.domain.replace(/\./g, '-')}.txt`;

  let dnsContent = `# DNS Configuration for ${dnsConfig.domain}\n`;
  dnsContent += `# Generated: ${new Date().toISOString()}\n\n`;

  Object.entries(dnsConfig.records).forEach(([key, record]) => {
    dnsContent += `# ${key.toUpperCase()} RECORD\n`;
    dnsContent += `Type: ${record.type}\n`;
    dnsContent += `Name: ${record.name}\n`;

    if (record.type === 'CNAME') {
      dnsContent += `Value: ${record.value}\n`;
    } else if (record.values && Array.isArray(record.values)) {
      dnsContent += `Values: ${record.values.join(', ')}\n`;
    } else {
      dnsContent += `Value: ${record.value || 'See Firebase console'}\n`;
    }

    dnsContent += `TTL: 300\n\n`;
  });

  dnsContent += `# Notes:\n`;
  dnsContent += `# 1. Replace 'await-firebase-verification-code' with actual code from Firebase console\n`;
  dnsContent += `# 2. Firebase hosting IPs may vary - check Firebase console for current values\n`;
  dnsContent += `# 3. DNS changes may take 24-48 hours to propagate globally\n`;

  if (!config.dryRun) {
    try {
      fs.writeFileSync(dnsPath, dnsContent);
      console.log(`✅ Created DNS records file: ${dnsPath}`);
    } catch (error) {
      console.error('❌ Error creating DNS records file:', error.message);
    }
  }

  return dnsPath;
}

// Update monitoring configuration
function updateMonitoringConfig(domain, config) {
  const monitoringConfigPath = 'monitoring/uptime-config.json';

  let monitoringConfig;
  try {
    if (fs.existsSync(monitoringConfigPath)) {
      monitoringConfig = JSON.parse(fs.readFileSync(monitoringConfigPath, 'utf8'));
    } else {
      console.log('⚠️ Monitoring configuration not found, skipping');
      return;
    }
  } catch (error) {
    console.error('⚠️ Error reading monitoring configuration:', error.message);
    return;
  }

  // Add or update domain endpoint
  const endpoint = {
    name: `PrintStack ${config.environment === 'prod' ? 'Production' : 'Development'} - ${domain}`,
    url: `https://${domain}`,
    method: 'GET',
    frequency: config.environment === 'prod' ? '900' : '3600', // 15 min for prod, 1 hour for dev
    regions: ['us-east1', 'us-west1', 'europe-west1'],
    alerts: {
      response_time_threshold: config.environment === 'prod' ? '3000' : '5000',
      success_rate_threshold: config.environment === 'prod' ? '99.5' : '95.0',
      consecutive_failures: config.environment === 'prod' ? '3' : '5'
    }
  };

  if (!monitoringConfig.endpoints) {
    monitoringConfig.endpoints = [];
  }

  const existingEndpoint = monitoringConfig.endpoints.find(
    e => e.url === `https://${domain}`
  );

  if (!existingEndpoint || config.force) {
    if (existingEndpoint && config.force) {
      // Remove existing
      monitoringConfig.endpoints = monitoringConfig.endpoints.filter(
        e => e.url !== `https://${domain}`
      );
    }

    monitoringConfig.endpoints.push(endpoint);
    console.log(`✅ Added monitoring endpoint for ${domain}`);

    if (!config.dryRun) {
      try {
        fs.writeFileSync(monitoringConfigPath, JSON.stringify(monitoringConfig, null, 2));
      } catch (error) {
        console.error('❌ Error updating monitoring configuration:', error.message);
      }
    }
  } else {
    console.log(`ℹ️ Monitoring endpoint already exists for ${domain}`);
  }
}

// Execute Firebase commands
function executeFirebaseCommands(domain, config) {
  console.log('\n🚀 Firebase Commands to Execute:');

  const commands = [
    `firebase hosting:sites:${config.project}:domains:add ${domain}`,
    `firebase hosting:sites:${config.project}:domains:list`
  ];

  commands.forEach(command => {
    console.log(`\n📝 Command: ${command}`);

    if (!config.dryRun) {
      try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
        console.log('✅ Command executed successfully');
      } catch (error) {
        console.error(`❌ Command failed: ${error.message}`);
      }
    } else {
      console.log('🔍 (Dry run - command not executed)');
    }
  });
}

// Print next steps
function printNextSteps(domain, dnsConfig, config) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 NEXT STEPS');
  console.log('='.repeat(60));

  console.log('\n1. 🌎 DOMAIN VERIFICATION');
  console.log(`   - Go to Firebase Console → Hosting → Custom domains`);
  console.log(`   - Your domain: ${domain}`);
  console.log(`   - Project: ${config.project}`);

  console.log('\n2. 📋 DNS CONFIGURATION');
  console.log(`   - Add the following records to your DNS provider:`);
  Object.entries(dnsConfig.records).forEach(([key, record]) => {
    console.log(`   - ${key.toUpperCase()}: ${record.type} ${record.name}`);
    if (record.type === 'CNAME') {
      console.log(`     Value: ${record.value}`);
    } else if (record.values && Array.isArray(record.values)) {
      console.log(`     Values: ${record.values.join(', ')}`);
    } else {
      console.log(`     Value: ${record.value || 'See Firebase console'}`);
    }
  });

  console.log('\n3. ⏳ WAIT FOR PROPAGATION');
  console.log('   - DNS changes: 24-48 hours');
  console.log('   - SSL certificate: Automatic after DNS verification');

  console.log('\n4. 🧪 TESTING');
  console.log(`   - Test: https://${domain}`);
  console.log('   - Verify SSL certificate');
  console.log('   - Check redirects (http → https)');
  console.log('   - Test www redirect (if applicable)');

  console.log('\n5. 📊 MONITORING');
  console.log('   - Check Firebase Hosting metrics');
  console.log('   - Monitor uptime monitoring alerts');
  console.log('   - Update analytics tracking');

  if (config.dryRun) {
    console.log('\n⚠️ DRY RUN MODE');
    console.log('   - No actual changes were made');
    console.log('   - Commands were shown but not executed');
    console.log('   - Run without --dry-run to execute');
  }

  console.log('\n📚 For detailed instructions, see: docs/custom-domain-setup.md');
  console.log('='.repeat(60));
}

// Main setup function
function setupCustomDomain(config) {
  console.log(`🌍 Setting up custom domain for PrintStack`);
  console.log(`Domain: ${config.domain}`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Project: ${config.project}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log('');

  if (!validateDomain(config.domain)) {
    console.error('❌ Invalid domain format');
    process.exit(1);
  }

  // Generate configuration
  const dnsConfig = generateDNSConfig(config.domain, config);
  const domainConfig = generateDomainConfig(config.domain, config);

  // Update files
  updateFirebaseConfig(config.domain, config);
  const dnsPath = generateDNSRecords(dnsConfig, config);
  updateMonitoringConfig(config.domain, config);

  // Execute Firebase commands
  if (!config.dryRun) {
    executeFirebaseCommands(config.domain, config);
  }

  // Print next steps
  printNextSteps(config.domain, dnsConfig, config);

  return {
    domain: config.domain,
    domainConfig,
    dnsConfig,
    dnsPath
  };
}

// Parse arguments and run
const config = parseArgs();

if (require.main === module) {
  setupCustomDomain(config);
}

module.exports = {
  setupCustomDomain,
  generateDNSConfig,
  updateFirebaseConfig,
  generateDomainConfig
};