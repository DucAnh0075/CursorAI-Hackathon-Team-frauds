// Simple test script for Minimax AI Video Generation
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testMinimaxVideoGeneration() {
    console.log('🚀 Starting Minimax AI Video Generation Test\n');

    const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        console.error('❌ No API key found in environment variables');
        console.error('   Please set VITE_MINIMAX_API_KEY or MINIMAX_API_KEY in your .env file');
        return;
    }

    console.log('✅ API Key found');
    console.log(`   Key preview: ${apiKey.substring(0, 10)}...`);

    // Test configuration
    const testPrompt = 'A beautiful sunrise over mountains with flowing water';
    const endpoints = [
        'https://api.minimax.chat/v1/video_generation',
        'https://api.minimax.io/v1/video_generation',
        'https://api.minimax.chat/v1/t2v',
    ];

    const payload = {
        model: 'video-01',
        prompt: testPrompt,
        duration: 5,
        aspect_ratio: '16:9',
        resolution: '720p'
    };

    console.log('\n📋 Test Configuration:');
    console.log('   Prompt:', testPrompt);
    console.log('   Duration: 5 seconds');
    console.log('   Resolution: 720p (16:9)\n');

    // Try each endpoint
    for (const baseUrl of endpoints) {
        console.log(`\n🔄 Testing endpoint: ${baseUrl}`);
        console.log('─'.repeat(60));

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            console.log('📤 Sending request...');
            const startTime = Date.now();

            const response = await axios.post(baseUrl, payload, {
                headers,
                timeout: 60000,
                validateStatus: () => true // Accept all status codes to see response
            });

            const duration = Date.now() - startTime;

            console.log(`\n📥 Response received in ${duration}ms`);
            console.log('   Status:', response.status, response.statusText);
            console.log('   Data:', JSON.stringify(response.data, null, 2));

            if (response.status === 200 || response.status === 201) {
                const taskId = response.data.task_id || response.data.id;
                if (taskId) {
                    console.log('\n✅ SUCCESS! Video generation task created!');
                    console.log('   Task ID:', taskId);

                    // If we get a task ID, try to check its status
                    await checkTaskStatus(baseUrl, apiKey, taskId);

                    console.log('\n🎉 Test completed successfully!');
                    return;
                } else {
                    console.log('\n⚠️  Task created but no task_id in response');
                }
            } else {
                console.log(`\n❌ Request failed with status ${response.status}`);
            }

        } catch (error) {
            console.error('\n❌ Error occurred:');
            if (error.response) {
                console.error('   Status:', error.response.status, error.response.statusText);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('   No response received');
                console.error('   Error:', error.message);
            } else {
                console.error('   Error:', error.message);
            }
        }
    }

    console.log('\n\n❌ All endpoints failed');
    console.log('\n💡 Suggestions:');
    console.log('   1. Verify your API key has video generation permissions');
    console.log('   2. Check Minimax API documentation for the correct endpoint');
    console.log('   3. Ensure video generation is enabled for your account');
    console.log('   4. Try contacting Minimax support for API access');
}

async function checkTaskStatus(baseUrl, apiKey, taskId) {
    console.log('\n🔍 Checking task status...');

    const statusEndpoints = [
        `${baseUrl}/${taskId}`,
        `${baseUrl}/status/${taskId}`,
        `${baseUrl.replace('/video_generation', '/video_generation/status')}/${taskId}`,
    ];

    for (const url of statusEndpoints) {
        try {
            console.log(`   Trying: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                timeout: 10000,
                validateStatus: () => true
            });

            if (response.status === 200) {
                console.log('   ✅ Status response:', JSON.stringify(response.data, null, 2));
                return;
            }
        } catch (error) {
            // Silently continue to next endpoint
        }
    }

    console.log('   ⚠️  Could not retrieve status (this is normal if status endpoint differs)');
}

// Run the test
testMinimaxVideoGeneration().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
