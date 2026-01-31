// Direct Node.js test for Minimax Video API
// Run with: node test-minimax-video-direct.js

import axios from 'axios';
import { readFileSync } from 'fs';

// Read API key from .env file
let apiKey = null;
try {
  const envContent = readFileSync('.env', 'utf-8');
  const match = envContent.match(/VITE_MINIMAX_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.log('Could not read .env file');
}

if (!apiKey) {
  console.error('❌ No API key found. Set VITE_MINIMAX_API_KEY in .env file');
  process.exit(1);
}

console.log('🧪 Testing Minimax Video Generation API...\n');
console.log('API Key:', apiKey.substring(0, 10) + '...\n');

// Try different endpoints
const endpoints = [
  'https://api.minimax.chat/v1/video_generation',
  'https://api.minimax.io/v1/video_generation',
  'https://api.minimax.chat/v1/video_generation/t2v'
];

async function testEndpoint(url) {
  console.log(`\n📤 Testing endpoint: ${url}`);
  
  try {
    const response = await axios.post(url, {
      model: 'video-01',
      prompt: 'Create a 5-second educational video explaining how to solve: x^2 + 5x + 6 = 0',
      duration: 5,
      aspect_ratio: '16:9',
      resolution: '720p'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    // Check if video is already in response (some APIs return it immediately)
    if (response.data.video_url || response.data.videoUrl || response.data.url) {
      const videoUrl = response.data.video_url || response.data.videoUrl || response.data.url;
      console.log(`\n✅ Video URL received directly!`);
      console.log(`Video URL: ${videoUrl}`);
      return { videoUrl, immediate: true };
    }

    if (response.data.task_id || response.data.id || response.data.taskId) {
      const taskId = response.data.task_id || response.data.id || response.data.taskId;
      console.log(`\n✅ Task created! Task ID: ${taskId}`);
      return { taskId, baseUrl: url };
    } else {
      console.log('⚠️  Unexpected response format');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.status} ${error.response.statusText}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return null;
  }
}

async function checkStatus(baseUrl, taskId) {
  // Try different status endpoint formats based on Minimax docs
  // Based on documentation, try query endpoint with POST
  const statusUrls = [
    // POST to query endpoint (most likely based on Minimax API pattern)
    { url: `https://api.minimax.io/v1/video_generation/query`, method: 'POST', body: { task_id: taskId } },
    // Try with different field names
    { url: `https://api.minimax.io/v1/video_generation/query`, method: 'POST', body: { taskId: taskId } },
    // GET with task_id in path
    { url: `https://api.minimax.io/v1/video_generation/${taskId}`, method: 'GET' },
    // GET with query parameter  
    { url: `https://api.minimax.io/v1/video_generation?task_id=${taskId}`, method: 'GET' },
    // Try status endpoint
    { url: `https://api.minimax.io/v1/video_generation/status`, method: 'POST', body: { task_id: taskId } },
    // Try task endpoint
    { url: `https://api.minimax.io/v1/video_generation/task/${taskId}`, method: 'GET' },
  ];
  
  for (const endpoint of statusUrls) {
    console.log(`\n🔄 Trying: ${endpoint.method} ${endpoint.url}`);
    
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      let response;
      if (endpoint.method === 'POST' && endpoint.body) {
        response = await axios.post(endpoint.url, endpoint.body, config);
      } else {
        response = await axios.get(endpoint.url, config);
      }

      console.log('✅ Status response received:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️  404 - trying next format...`);
        continue;
      } else if (error.response) {
        console.log(`❌ Error: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
  
  return null;
}

async function main() {
  let taskInfo = null;
  
  // Try each endpoint
  for (const endpoint of endpoints) {
    taskInfo = await testEndpoint(endpoint);
    if (taskInfo) {
      break;
    }
  }

  if (!taskInfo) {
    console.log('\n❌ Could not create video task with any endpoint.');
    console.log('\nPossible issues:');
    console.log('1. Video generation API might not be available for your account');
    console.log('2. API endpoint might be different');
    console.log('3. API key might not have video generation permissions');
    process.exit(1);
  }

  // If video URL was returned immediately, we're done
  if (taskInfo.videoUrl) {
    console.log('\n✅ Video generated successfully!');
    console.log(`Video URL: ${taskInfo.videoUrl}`);
    console.log('\nYou can test this URL in a browser to see if the video plays.');
    process.exit(0);
  }

  // Poll for completion
  console.log('\n🔄 Polling for video completion...');
  console.log('Note: If status endpoint keeps returning 404, the API might:');
  console.log('1. Return video URL in creation response (check above)');
  console.log('2. Use a different status endpoint format');
  console.log('3. Require webhook/callback instead of polling');
  let attempts = 0;
  const maxAttempts = 12; // 1 minute (5 second intervals)

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nAttempt ${attempts}/${maxAttempts}:`);
    
    const status = await checkStatus(taskInfo.baseUrl, taskInfo.taskId);
    
    if (!status) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    if (status.status === 'completed' || status.status === 'success') {
      const videoUrl = status.video_url || status.videoUrl || status.url || status.file_url;
      if (videoUrl) {
        console.log(`\n✅ Video generated successfully!`);
        console.log(`Video URL: ${videoUrl}`);
        console.log('\nYou can test this URL in a browser to see if the video plays.');
        process.exit(0);
      }
    } else if (status.status === 'failed' || status.status === 'error') {
      console.log(`\n❌ Video generation failed: ${status.error || status.message}`);
      process.exit(1);
    } else {
      console.log(`Status: ${status.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n⏱️  Timeout: Video generation is taking longer than expected.');
  console.log('This is normal - video generation can take several minutes.');
  console.log(`Task ID: ${taskInfo.taskId}`);
  console.log('You can check the status manually using the task ID.');
}

main().catch(console.error);
