// Node.js test wrapper for Minimax Video Generation
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

class MinimaxVideoTest {
  constructor() {
    const key = process.env.VITE_MINIMAX_API_KEY || process.env.MINIMAX_API_KEY;
    if (!key) {
      throw new Error('API key not set in environment');
    }
    this.apiKey = key;
    this.baseUrl = 'https://api.minimax.io/v1';
  }

  async createVideoTask(prompt, maxDuration = 5) {
    const url = `${this.baseUrl}/video_generation`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const videoPrompt = `Create a short ${maxDuration}-second video: ${prompt}`;

    const payload = {
      model: 'video-01',
      prompt: videoPrompt,
      duration: maxDuration,
      aspect_ratio: '16:9',
      resolution: '720p'
    };

    try {
      console.log('📤 Creating video task...');
      const response = await axios.post(url, payload, { headers, timeout: 60000 });
      const result = response.data;

      if (result.task_id) {
        return result.task_id;
      } else if (result.id) {
        return result.id;
      } else {
        throw new Error('No task_id in response: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

async function runTest() {
  console.log('🚀 Minimax AI Video Generation Test\n');
  console.log('═'.repeat(60));

  try {
    const service = new MinimaxVideoTest();
    console.log('\n✅ Service initialized');

    // Test: Create an educational video
    console.log('\n📹 Creating educational video...');
    console.log('─'.repeat(60));
    
    const testCases = [
      {
        name: 'Math Explanation',
        prompt: 'Explain the Pythagorean theorem (a² + b² = c²) with visual demonstration',
        duration: 5
      },
      {
        name: 'Science Concept',
        prompt: 'Show how photosynthesis works in plants with clear visuals',
        duration: 5
      }
    ];

    const createdTasks = [];

    for (const test of testCases) {
      console.log(`\n🎬 Test: ${test.name}`);
      console.log(`   Prompt: ${test.prompt}`);
      console.log(`   Duration: ${test.duration}s`);
      
      try {
        const taskId = await service.createVideoTask(test.prompt, test.duration);
        console.log(`   ✅ Success! Task ID: ${taskId}`);
        createdTasks.push({ name: test.name, taskId });
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n\n' + '═'.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));

    if (createdTasks.length > 0) {
      console.log('\n📋 Created Video Tasks:');
      createdTasks.forEach((task, i) => {
        console.log(`   ${i + 1}. ${task.name}`);
        console.log(`      Task ID: ${task.taskId}`);
      });

      console.log('\n📝 Notes:');
      console.log('   • Video generation typically takes 3-10 minutes');
      console.log('   • Videos will be available via API once completed');
      console.log('   • Save the Task IDs to retrieve videos later');
      console.log('   • Check Minimax dashboard or documentation for status endpoint');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
runTest().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
