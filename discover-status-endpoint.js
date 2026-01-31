// Comprehensive endpoint discovery tool for Minimax video status
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;

if (!apiKey) {
  console.error('❌ No API key found');
  process.exit(1);
}

const taskId = process.argv[2] || '361720188367060';

console.log('🔍 Minimax Video Status Endpoint Discovery\n');
console.log('Task ID:', taskId);
console.log('═'.repeat(70));

const baseDomains = [
  'https://api.minimax.io',
  'https://api.minimax.chat',
  'https://video-api.minimax.io',
];

const pathPatterns = [
  '/v1/query/video_generation',
  '/v1/video_generation/query',
  '/v1/video_generation/status',
  '/v1/t2v/query',
  '/v1/t2v/status',
  '/v1/video/query',
  '/v1/video/status',
  '/v1/files/retrieve',
  '/v1/query',
  `/v1/video_generation/${taskId}`,
  `/v1/t2v/${taskId}`,
  `/v1/query/${taskId}`,
  `/v1/status/${taskId}`,
];

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function testEndpoint(url, method, body = null) {
  try {
    const config = { headers, timeout: 10000, validateStatus: () => true };
    
    let response;
    if (method === 'POST') {
      response = await axios.post(url, body || { task_id: taskId }, config);
    } else if (method === 'GET') {
      response = await axios.get(url, config);
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      success: false
    };
  }
}

async function discover() {
  const results = [];
  let testCount = 0;
  let successCount = 0;

  for (const domain of baseDomains) {
    console.log(`\n📡 Testing domain: ${domain}`);
    console.log('─'.repeat(70));

    for (const path of pathPatterns) {
      const url = domain + path;
      
      // Test both POST and GET
      for (const method of ['POST', 'GET']) {
        testCount++;
        const result = await testEndpoint(url, method);
        
        const statusDisplay = result.status === 'ERROR' ? '❌ ERROR' : 
                             result.status === 404 ? '404' :
                             result.status === 200 ? '✅ 200' :
                             result.status;

        process.stdout.write(`\r${method} ${path.padEnd(40)} → ${statusDisplay}    `);

        if (result.success || (result.status !== 404 && result.status !== 'ERROR')) {
          console.log(''); // New line for important results
          
          results.push({
            url,
            method,
            status: result.status,
            data: result.data
          });

          if (result.success) {
            successCount++;
            console.log(`\n🎯 POTENTIAL MATCH FOUND!`);
            console.log('   URL:', url);
            console.log('   Method:', method);
            console.log('   Status:', result.status);
            console.log('   Response:', JSON.stringify(result.data, null, 2));
            console.log('');
          } else if (result.status !== 404) {
            console.log(`   Response (${result.status}):`, JSON.stringify(result.data, null, 2));
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 DISCOVERY SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total tests: ${testCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${testCount - successCount}`);

  if (results.length > 0) {
    console.log('\n📋 Non-404 Responses:');
    results.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.method} ${r.url}`);
      console.log(`   Status: ${r.status}`);
      if (r.data && typeof r.data === 'object') {
        console.log(`   Data:`, JSON.stringify(r.data, null, 2));
      }
    });
  }

  if (successCount === 0) {
    console.log('\n⚠️  NO WORKING STATUS ENDPOINT FOUND');
    console.log('\n💡 Possible reasons:');
    console.log('   1. Status endpoint requires different authentication');
    console.log('   2. Videos may need more processing time before status is available');
    console.log('   3. Status checking might be dashboard-only (no API endpoint)');
    console.log('   4. Different endpoint path not tested yet');
    console.log('\n📚 Recommendations:');
    console.log('   • Check official Minimax API documentation');
    console.log('   • Contact Minimax support for status endpoint details');
    console.log('   • Check your account dashboard for video status');
    console.log('   • Try again in 5-10 minutes (videos may not be processed yet)');
  }
}

discover().catch(error => {
  console.error('\n💥 Discovery failed:', error.message);
  process.exit(1);
});
