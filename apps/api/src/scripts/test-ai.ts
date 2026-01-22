import { analyzeScentProfile, getAIProvider } from '../services/ai.service';

async function testAIProviders() {
  console.log(`🧪 Testing AI Provider: ${getAIProvider()}`);

  const testQuestionnaire = {
    loves_scents: 'Rose, Jasmine, Vanilla',
    avoids_scents: 'Citrus, Musk',
    desired_emotions: 'Confidence, Romance',
    favorite_memory: 'Walking in a garden at sunset',
    lifestyle: ['Professional', 'Romantic'],
    intensity: 7
  };

  try {
    console.log('📝 Analyzing scent profile...');
    const profile = await analyzeScentProfile(testQuestionnaire);

    console.log('✅ Profile generated successfully!');
    console.log('Dominant Family:', profile.dominant_family);
    console.log('Intensity:', profile.intensity);
    console.log('Base Notes:', profile.recommended_base.join(', '));
    console.log('Heart Notes:', profile.recommended_heart.join(', '));
    console.log('Top Notes:', profile.recommended_top.join(', '));
    console.log('Personality:', profile.personality.substring(0, 100) + '...');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testAIProviders();