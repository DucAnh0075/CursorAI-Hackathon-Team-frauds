// Test the query endpoint with different parameter formats
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;
const taskId = process.argv[2] || '361720188367060';

console.log('🧪 Testing /v1/query/video_generation endpoint\n');
console.log('Task ID:', taskId);
console.log('═'.repeat(60));

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

const testCases = [
  { name: 'POST with task_id in body', method: 'POST', body: { task_id: taskId } },
  { name: 'POST with taskId in body', method: 'POST', body: { taskId: taskId } },
  { name: 'POST with task_ids array', method: 'POST', body: { task_ids: [taskId] } },
  { name: 'POST with id field', method: 'POST', body: { id: taskId } },
  { name: 'GET with task_id param', method: 'GET', params: { task_id: taskId } },
  { name: 'GET with taskId param', method: 'GET', params: { taskId: taskId } },
  { name: 'GET with id param', method: 'GET', params: { id: taskId } },
];

async function testEndpoint(testCase) {
  const url = 'https://api.minimax.io/v1/query/video_generation';
  
  console.log(`\n📤 ${testCase.name}`);
  console.log('─'.repeat(60));
  
  try {
    let response;
    const config = { headers, timeout: 10000, validateStatus: () => true };
    
    if (testCase.method === 'POST') {
      console.log('Body:', JSON.stringify(testCase.body));
      response = await axios.post(url, testCase.body, config);
    } else {
      console.log('Params:', JSON.stringify(testCase.params));
      response = await axios.get(url, { ...config, params: testCase.params });
    }
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.base_resp?.status_code === 0) {
      console.log('\n✅ SUCCESS! This format works!');
      return true;
    } else if (response.data.base_resp?.status_code === 2013) {
      console.log('⚠️  Invalid params - wrong format');
    }
    
    return false;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  for (const testCase of testCases) {
    const success = await testEndpoint(testCase);
    if (success) {
      console.log('\n🎉 Found working format!');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Test complete');
}

runTests().catch(console.error);
