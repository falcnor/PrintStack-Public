#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build analysis script
 * Analyzes the build output to provide insights on bundle sizes and lazy loading
 */

function analyzeBuildOutput() {
  const outputDir = './deploy';
  const analysis = {
    totalSize: 0,
    chunks: [],
    recommendations: []
  };

  try {
    const files = fs.readdirSync(outputDir);

    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size / 1024; // Size in KB

        analysis.chunks.push({
          name: file,
          size: size,
          path: filePath
        });

        analysis.totalSize += size;
      }
    });

    // Sort chunks by size
    analysis.chunks.sort((a, b) => b.size - a.size);

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis.chunks);

    console.log('📊 Build Analysis Report');
    console.log('========================');
    console.log(`Total bundle size: ${analysis.totalSize.toFixed(2)} KB`);
    console.log('');

    console.log('🔍 Chunk Analysis:');
    analysis.chunks.forEach(chunk => {
      console.log(`${chunk.name}: ${chunk.size.toFixed(2)} KB`);
      if (chunk.size > 200) {
        console.log(`  ⚠️  Large chunk detected - consider further splitting`);
      }
    });

    console.log('');
    console.log('💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    // Save analysis to file
    fs.writeFileSync(
      path.join(outputDir, 'build-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    console.log('');
    console.log('✅ Detailed analysis saved to deploy/build-analysis.json');

  } catch (error) {
    console.error('❌ Error analyzing build:', error.message);
    process.exit(1);
  }
}

function generateRecommendations(chunks) {
  const recommendations = [];

  const largeChunks = chunks.filter(chunk => chunk.size > 200);
  if (largeChunks.length > 0) {
    recommendations.push(`${largeChunks.length} large chunks detected. Consider implementing more granular code splitting.`);
  }

  const vendorChunk = chunks.find(chunk => chunk.name.includes('vendor'));
  if (vendorChunk && vendorChunk.size > 150) {
    recommendations.push('Vendor bundle is large. Consider tree shaking and removing unused dependencies.');
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  if (totalSize > 1000) {
    recommendations.push('Total bundle size is over 1MB. Consider implementing lazy loading for non-critical components.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Bundle sizes look good! 🎉');
  }

  return recommendations;
}

// Run the analysis
if (require.main === module) {
  analyzeBuildOutput();
}

module.exports = { analyzeBuildOutput };