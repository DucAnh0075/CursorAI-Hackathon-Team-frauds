// Quick test script to verify Minimax video API
const axios = require('axios');
require('dotenv').config();

async function testMinimaxVideo() {
  const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Minimax API key found');
    return;
  }

  console.log('🧪 Testing Minimax Video Generation API...\n');

  const url = 'https://api.minimax.io/v1/video_generation';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    model: 'video-01',
    prompt: 'Create a 5-second educational video explaining how to solve: x^2 + 5x + 6 = 0',
    duration: 5,
    aspect_ratio: '16:9',
    resolution: '720p'
  };

  try {
    console.log('📤 Sending request to Minimax...');
    console.log('URL:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(url, payload, { headers, timeout: 60000 });
    
    console.log('\n✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.task_id || response.data.id) {
      console.log('\n✅ Task created successfully!');
      console.log('Task ID:', response.data.task_id || response.data.id);
    } else {
      console.log('\n⚠️  Unexpected response format');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.response?.status, error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
    
    if (error.response?.status === 404) {
      console.error('\n⚠️  Endpoint not found - API endpoint might be different');
    } else if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication failed - check your API key');
    }
  }
}

testMinimaxVideo();
