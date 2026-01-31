// Video download utility for Minimax AI generated videos
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;
const VIDEOS_DIR = './videos';

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/**
 * Check video generation status and get video URL
 */
async function getVideoStatus(taskId) {
  if (!apiKey) {
    throw new Error('API key not found');
  }

  const baseUrl = 'https://api.minimax.io/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  // Use the working endpoint discovered through testing
  const endpoint = `${baseUrl}/query/video_generation`;
  const params = { task_id: taskId };

  try {
    const response = await axios.get(endpoint, { headers, params, timeout: 10000 });
    const data = response.data;
    
    if (data.base_resp?.status_code === 0) {
      // Success! Get file_id and retrieve video URL
      const fileId = data.file_id;
      const status = data.status;
      
      if (fileId) {
        // Get video URL from file_id
        const fileResponse = await axios.get(
          `${baseUrl}/files/retrieve`,
          { headers, params: { file_id: fileId }, timeout: 10000 }
        );
        
        const videoUrl = fileResponse.data.file?.download_url;
        
        return {
          status,
          video_url: videoUrl,
          file_id: fileId,
          task_id: taskId,
          raw: data
        };
      }
    }
  } catch (error) {
    // Endpoint failed
    return null;
  }

  return null;
}

/**
 * Download video from URL and save to local file
 */
async function downloadVideo(videoUrl, taskId, outputFilename = null) {
  console.log('📥 Downloading video...');
  console.log('   URL:', videoUrl);

  try {
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minutes timeout
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          process.stdout.write(`\r   Progress: ${percent}%`);
        }
      }
    });

    const filename = outputFilename || `video_${taskId}_${Date.now()}.mp4`;
    const filepath = path.join(VIDEOS_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(response.data));
    
    console.log(`\n✅ Video saved to: ${filepath}`);
    console.log(`   Size: ${(response.data.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    return filepath;
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    throw error;
  }
}

/**
 * Main function: check status and download video if ready
 */
async function downloadVideoByTaskId(taskId, outputFilename = null, waitForCompletion = false) {
  console.log('🔍 Checking video status for Task ID:', taskId);
  console.log('─'.repeat(60));

  let attempts = 0;
  const maxAttempts = waitForCompletion ? 40 : 1; // 40 attempts = ~10 minutes if polling

  while (attempts < maxAttempts) {
    attempts++;

    const status = await getVideoStatus(taskId);

    if (!status) {
      console.log('❌ Could not retrieve status (endpoint not found)');
      console.log('\n💡 The status endpoint has not been identified yet.');
      console.log('   Possible solutions:');
      console.log('   1. Run endpoint discovery: node discover-status-endpoint.js');
      console.log('   2. Check Minimax dashboard for video status');
      console.log('   3. Wait 5-10 minutes and check dashboard manually');
      console.log('   4. Contact Minimax support for API documentation');
      
      if (waitForCompletion && attempts < maxAttempts) {
        console.log('\n⏳ Waiting 15 seconds before retry...\n');
        await new Promise(resolve => setTimeout(resolve, 15000));
        continue;
      }
      return null;
    }

    console.log('📊 Status:', status.status);
    
    if (status.video_url) {
      console.log('✅ Video is ready!\n');
      return await downloadVideo(status.video_url, taskId, outputFilename);
    } else {
      console.log('⏳ Video is still processing...');
      
      if (waitForCompletion && attempts < maxAttempts) {
        console.log(`   Attempt ${attempts}/${maxAttempts} - waiting 15 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        console.log('\n💡 Video is not ready yet. Try again later or use --wait flag');
        return null;
      }
    }
  }

  console.log('\n⏱️  Timeout: Video generation is taking longer than expected');
  return null;
}

// Parse command line arguments
const args = process.argv.slice(2);
const taskId = args[0];
const hasWaitFlag = args.includes('--wait') || args.includes('-w');
const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
const outputFilename = outputIndex !== -1 ? args[outputIndex + 1] : null;

if (!taskId) {
  console.log('📥 Minimax Video Downloader\n');
  console.log('Usage: node download-video.js <task_id> [options]\n');
  console.log('Options:');
  console.log('  --wait, -w              Wait for video to complete (polls every 15s)');
  console.log('  --output, -o <filename> Custom output filename\n');
  console.log('Examples:');
  console.log('  node download-video.js 361720188367060');
  console.log('  node download-video.js 361720188367060 --wait');
  console.log('  node download-video.js 361720188367060 -o my-video.mp4');
  console.log('  node download-video.js 361720188367060 --wait --output my-video.mp4\n');
  console.log('💡 Videos are saved to: ./videos/');
  process.exit(1);
}

// Run the download
downloadVideoByTaskId(taskId, outputFilename, hasWaitFlag)
  .then(filepath => {
    if (filepath) {
      console.log('\n🎉 Download complete!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
