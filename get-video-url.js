// Get video file URL from file_id
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;
const fileId = process.argv[2];

if (!fileId) {
  console.log('Usage: node get-video-url.js <file_id>');
  console.log('Example: node get-video-url.js 361721749176519');
  process.exit(1);
}

console.log('🔍 Getting video URL for file_id:', fileId);
console.log('═'.repeat(60));

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function getVideoUrl() {
  const endpoints = [
    { url: 'https://api.minimax.io/v1/files/retrieve', params: { file_id: fileId } },
    { url: 'https://api.minimax.io/v1/files/retrieve', params: { id: fileId } },
    { url: `https://api.minimax.io/v1/files/${fileId}`, params: {} },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📤 Trying: ${endpoint.url}`);
      console.log('   Params:', JSON.stringify(endpoint.params));
      
      const response = await axios.get(endpoint.url, {
        headers,
        params: endpoint.params,
        timeout: 10000,
        validateStatus: () => true
      });

      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));

      if (response.status === 200 && response.data) {
        const videoUrl = response.data.file?.download_url || 
                        response.data.download_url || 
                        response.data.url ||
                        response.data.file_url;
        
        if (videoUrl) {
          console.log('\n✅ VIDEO URL FOUND!');
          console.log('   URL:', videoUrl);
          return videoUrl;
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n⚠️  Could not retrieve video URL');
  return null;
}

getVideoUrl().catch(console.error);
