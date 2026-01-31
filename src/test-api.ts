// Quick test script to verify API setup
// Run this in browser console to test

export async function testAPI() {
  console.log('🧪 Testing API Configuration...\n')
  
  // Check environment variables
  const minimaxKey = import.meta.env.VITE_MINIMAX_API_KEY
  const manusKey = import.meta.env.VITE_MANUS_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  console.log('Environment Variables:')
  console.log(`  VITE_MINIMAX_API_KEY: ${minimaxKey ? '✅ Set' : '❌ Not set'}`)
  console.log(`  VITE_MANUS_API_KEY: ${manusKey ? '✅ Set' : '❌ Not set'}`)
  console.log(`  VITE_OPENAI_API_KEY: ${openaiKey ? '✅ Set' : '❌ Not set'}`)
  console.log()
  
  // Determine provider
  let provider = 'none'
  if (minimaxKey) provider = 'minimax'
  else if (manusKey) provider = 'manus'
  else if (openaiKey) provider = 'openai'
  
  console.log(`Detected Provider: ${provider.toUpperCase()}\n`)
  
  if (provider === 'none') {
    console.error('❌ No API key found!')
    console.log('Please set one of these in your .env file:')
    console.log('  VITE_MINIMAX_API_KEY=your_key')
    console.log('  VITE_MANUS_API_KEY=your_key')
    console.log('  VITE_OPENAI_API_KEY=your_key')
    return false
  }
  
  // Test API call
  console.log('Testing API call...')
  try {
    const { aiService } = await import('./services/api')
    const testQuestion = 'What is 2+2?'
    console.log(`Question: "${testQuestion}"`)
    
    const result = await aiService.generateExplanation(testQuestion)
    console.log('✅ API call successful!')
    console.log('Response structure:', {
      hasIntroduction: !!result.introduction,
      stepsCount: result.steps.length,
      keyPointsCount: result.key_points.length,
      hasConclusion: !!result.conclusion
    })
    return true
  } catch (error: any) {
    console.error('❌ API call failed:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI
}
