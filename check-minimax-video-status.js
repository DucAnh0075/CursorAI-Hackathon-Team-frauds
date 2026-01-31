// Script to check the status of a Minimax video generation task
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkVideoStatus(taskId) {
    console.log('🔍 Checking Minimax Video Generation Status\n');

    const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        console.error('❌ No API key found');
        return;
    }

    if (!taskId) {
        console.error('❌ Please provide a task ID');
        console.log('   Usage: node check-minimax-video-status.js <task_id>');
        return;
    }

    console.log('📋 Task ID:', taskId);
    console.log('─'.repeat(60));

    const baseUrl = 'https://api.minimax.io/v1';
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    // Try different status endpoint patterns
    const statusEndpoints = [
        `${baseUrl}/query/video_generation`,
        `${baseUrl}/video_generation/query`,
        `${baseUrl}/video_generation/${taskId}`,
        `${baseUrl}/query/${taskId}`,
    ];

    for (const url of statusEndpoints) {
        console.log(`\n🔄 Trying: ${url}`);

        try {
            // Try both POST and GET methods
            for (const method of ['post', 'get']) {
                try {
                    console.log(`   Method: ${method.toUpperCase()}`);

                    const config = {
                        headers,
                        timeout: 10000,
                        validateStatus: () => true
                    };

                    let response;
                    if (method === 'post') {
                        response = await axios.post(url, { task_id: taskId }, config);
                    } else {
                        response = await axios.get(url, config);
                    }

                    console.log('   Status:', response.status);
                    console.log('   Response:', JSON.stringify(response.data, null, 2));

                    if (response.status === 200 && response.data) {
                        if (response.data.status || response.data.file_id || response.data.video_url) {
                            console.log('\n✅ Status retrieved successfully!');

                            const data = response.data;
                            console.log('\n📊 Video Generation Status:');
                            console.log('   Status:', data.status || data.base_resp?.status_msg || 'unknown');

                            if (data.file_id) {
                                console.log('   File ID:', data.file_id);
                            }

                            if (data.video_url) {
                                console.log('   Video URL:', data.video_url);
                                console.log('\n🎬 Video is ready! You can download it from the URL above.');
                            } else if (data.status === 'processing' || data.status === 'pending') {
                                console.log('\n⏳ Video is still being generated. Check back in a few minutes.');
                            } else if (data.status === 'failed') {
                                console.log('\n❌ Video generation failed.');
                                if (data.error) {
                                    console.log('   Error:', data.error);
                                }
                            }

                            return;
                        }
                    }
                } catch (methodError) {
                    // Continue to next method
                }
            }
        } catch (error) {
            // Continue to next endpoint
        }
    }

    console.log('\n\n⚠️  Could not retrieve status with any known endpoint pattern');
    console.log('\n💡 The video might still be processing. Status endpoints may require:');
    console.log('   - Different API paths');
    console.log('   - Polling after some time');
    console.log('   - Check Minimax documentation for status query endpoint');
}

// Get task ID from command line argument
const taskId = process.argv[2];
checkVideoStatus(taskId).catch(error => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
});
