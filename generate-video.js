#!/usr/bin/env node
// Quick command-line tool to generate a Minimax AI video

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;

if (!apiKey) {
  console.error('❌ Error: No API key found');
  console.error('Set VITE_MINIMAX_API_KEY or MINIMAX_API_KEY in your .env file');
  process.exit(1);
}

const prompt = process.argv[2];
const duration = parseInt(process.argv[3] || '5');

if (!prompt) {
  console.log('Usage: node generate-video.js "your prompt here" [duration]');
  console.log('');
  console.log('Examples:');
  console.log('  node generate-video.js "A sunset over the ocean"');
  console.log('  node generate-video.js "Explain gravity" 10');
  process.exit(1);
}

console.log('🎬 Minimax AI Video Generator\n');
console.log('Prompt:', prompt);
console.log('Duration:', duration, 'seconds\n');

async function generateVideo() {
  try {
    const response = await axios.post(
      'https://api.minimax.io/v1/video_generation',
      {
        model: 'video-01',
        prompt: prompt,
        duration: duration,
        aspect_ratio: '16:9',
        resolution: '720p'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.task_id) {
      console.log('✅ Success! Video generation started');
      console.log('');
      console.log('Task ID:', response.data.task_id);
      console.log('');
      console.log('📝 Save this Task ID to check the video status later');
      console.log('⏳ Video generation typically takes 3-10 minutes');
    } else {
      console.log('⚠️  Unexpected response:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

generateVideo();
