#!/usr/bin/env node

/**
 * Test script for Global Price Scraper API
 * Demonstrates the functionality with required test cases
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const OUTPUT_DIR = 'test-results';

// Test cases as specified in the requirements
const testCases = [
  {
    name: 'US iPhone Search',
    request: {
      country: 'US',
      query: 'iPhone 16 Pro, 128GB'
    }
  },
  {
    name: 'India Audio Product Search',
    request: {
      country: 'IN',
      query: 'boAt Airdopes 311 Pro'
    }
  },
  {
    name: 'UK Electronics Search',
    request: {
      country: 'GB',
      query: 'Samsung Galaxy S24'
    }
  }
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Helper function to make HTTP requests
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Test health endpoint
async function testHealth() {
  console.log('🔍 Testing health endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE}/api/health`, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Health check passed');
      console.log('📊 Server info:', response.data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test price search endpoint
async function testPriceSearch(testCase) {
  console.log(`\n🔍 Testing: ${testCase.name}`);
  console.log(`📝 Query: "${testCase.request.query}" in ${testCase.request.country}`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${API_BASE}/api/prices/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(testCase.request));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.statusCode === 200) {
      const results = response.data.results || [];
      const metadata = response.data.metadata || {};
      
      console.log(`✅ Request successful (${duration}ms)`);
      console.log(`📊 Found ${results.length} products`);
      console.log(`🌐 Searched ${metadata.sitesSearched || 0} websites`);
      console.log(`⚡ Processing time: ${metadata.processingTime || 0}ms`);
      
      if (results.length > 0) {
        console.log('\n💰 Top 3 Results:');
        results.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.productName}`);
          console.log(`     💲 ${product.price} (${product.source})`);
          console.log(`     🔗 ${product.link}`);
        });
        
        if (metadata.priceStatistics) {
          console.log('\n📈 Price Statistics:');
          console.log(`     Min: ${metadata.priceStatistics.min}`);
          console.log(`     Max: ${metadata.priceStatistics.max}`);
          console.log(`     Avg: ${metadata.priceStatistics.average}`);
        }
      }
      
      // Save results to file
      const fileName = `${OUTPUT_DIR}/${testCase.name.replace(/\s+/g, '_').toLowerCase()}_results.json`;
      fs.writeFileSync(fileName, JSON.stringify(response.data, null, 2));
      console.log(`💾 Results saved to: ${fileName}`);
      
      return {
        success: true,
        resultCount: results.length,
        duration,
        processingTime: metadata.processingTime
      };
      
    } else {
      console.log(`❌ Request failed: ${response.statusCode}`);
      console.log('📝 Response:', response.data);
      return { success: false, statusCode: response.statusCode };
    }
    
  } catch (error) {
    console.log(`❌ Request error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test supported countries endpoint
async function testSupportedCountries() {
  console.log('\n🔍 Testing supported countries endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE}/api/prices/supported`, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      const data = response.data;
      console.log('✅ Supported countries retrieved');
      console.log(`🌍 Countries: ${data.supportedCountries.length}`);
      console.log(`🏪 Total sites: ${data.totalSites}`);
      
      data.supportedCountries.forEach(country => {
        console.log(`  ${country.country} (${country.currency}): ${country.sites.length} sites`);
      });
      
      return true;
    } else {
      console.log('❌ Failed to get supported countries');
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting supported countries:', error.message);
    return false;
  }
}

// Generate summary report
function generateSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful tests: ${successful}/${total}`);
  
  if (successful > 0) {
    const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + (r.duration || 0), 0) / successful;
    const avgProcessingTime = results.filter(r => r.success).reduce((sum, r) => sum + (r.processingTime || 0), 0) / successful;
    const totalResults = results.filter(r => r.success).reduce((sum, r) => sum + (r.resultCount || 0), 0);
    
    console.log(`⚡ Average response time: ${Math.round(avgDuration)}ms`);
    console.log(`🔧 Average processing time: ${Math.round(avgProcessingTime)}ms`);
    console.log(`📊 Total products found: ${totalResults}`);
  }
  
  console.log(`\n📁 Test results saved in: ${OUTPUT_DIR}/`);
  console.log('='.repeat(60));
}

// Generate curl examples
function generateCurlExamples() {
  console.log('\n🔗 CURL EXAMPLES FOR TESTING:');
  console.log('='.repeat(60));
  
  testCases.forEach(testCase => {
    console.log(`\n# ${testCase.name}`);
    console.log(`curl -X POST ${API_BASE}/api/prices/search \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '${JSON.stringify(testCase.request)}'`);
  });
  
  console.log(`\n# Health Check`);
  console.log(`curl ${API_BASE}/api/health`);
  
  console.log(`\n# Supported Countries`);
  console.log(`curl ${API_BASE}/api/prices/supported`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Global Price Scraper API Tests');
  console.log(`🌐 API Base URL: ${API_BASE}`);
  console.log('='.repeat(60));
  
  // Test health first
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Please ensure the server is running.');
    process.exit(1);
  }
  
  // Test supported countries
  await testSupportedCountries();
  
  // Run price search tests
  const results = [];
  for (const testCase of testCases) {
    const result = await testPriceSearch(testCase);
    results.push(result);
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary
  generateSummary(results);
  
  // Generate curl examples
  generateCurlExamples();
  
  console.log('\n🎉 Testing complete!');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Global Price Scraper API Test Script');
  console.log('');
  console.log('Usage: node test-api.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  API_URL        Base URL for the API (default: http://localhost:3000)');
  console.log('');
  console.log('Examples:');
  console.log('  node test-api.js');
  console.log('  API_URL=https://your-deployed-app.vercel.app node test-api.js');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
}); 