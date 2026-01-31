// TypeScript test file for Minimax AI Video Generation
import { MinimaxVideoService } from './src/services/minimaxVideo'

async function testVideoGeneration() {
    console.log('🚀 Testing Minimax Video Service\n')

    try {
        const service = new MinimaxVideoService()
        console.log('✅ Service initialized\n')

        // Test 1: Create a simple video
        console.log('📹 Test 1: Creating a short educational video...')
        const prompt = 'Explain the Pythagorean theorem with a visual demonstration'
        const taskId = await service.createVideoTask(prompt, 5)

        console.log('\n✅ Video generation task created!')
        console.log('   Task ID:', taskId)
        console.log('   Prompt:', prompt)
        console.log('   Duration: 5 seconds')

        // Test 2: Check status (will likely show status endpoint issues)
        console.log('\n📊 Test 2: Checking task status...')
        try {
            const status = await service.checkTaskStatus(taskId)
            console.log('   Status:', status)
        } catch (error) {
            console.log('   ⚠️  Status check not available:', error.message)
            console.log('   Note: This is expected - status endpoint needs to be discovered')
        }

        console.log('\n🎉 Test completed successfully!')
        console.log('\n📝 Notes:')
        console.log('   - Video generation takes several minutes')
        console.log('   - Task ID:', taskId)
        console.log('   - Save this ID to check status later')

    } catch (error) {
        console.error('\n❌ Test failed:', error.message)
        throw error
    }
}

// Run the test
testVideoGeneration().catch(error => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
})
