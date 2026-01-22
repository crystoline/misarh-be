import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from monorepo root
dotenv.config({ path: '../../.env' });

// Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'gemini'

console.log(`🤖 AI Service initialized with provider: ${AI_PROVIDER}`);

// Lazy initialize clients only when needed
let openai: OpenAI | null = null;
let gemini: GoogleGenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required when using OpenAI');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

const getGeminiClient = (): GoogleGenAI => {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required when using Gemini');
    }
    console.log('Initializing Google Gemini client');
    gemini = new GoogleGenAI({ apiKey });
  }
  return gemini;
};

/**
 * Generate mock scent profile for fallback when OpenAI is unavailable
 */
const generateMockScentProfile = (questionnaire: any): any => {
  // Simple logic based on questionnaire
  const hasFloral = questionnaire.loves_scents?.toLowerCase().includes('floral') || 
                    questionnaire.loves_scents?.toLowerCase().includes('rose');
  const hasWoody = questionnaire.loves_scents?.toLowerCase().includes('wood') || 
                   questionnaire.loves_scents?.toLowerCase().includes('cedar');
  
  let family = hasFloral ? 'Floral' : hasWoody ? 'Woody' : 'Oriental';
  let intensity = questionnaire.intensity > 7 ? 'Strong' : questionnaire.intensity < 4 ? 'Light' : 'Medium';

  return {
    dominant_family: family,
    intensity: intensity,
    recommended_base: ['Vanilla', 'Sandalwood', 'Amber'],
    recommended_heart: ['Rose', 'Jasmine', 'Ylang Ylang'],
    recommended_top: ['Bergamot', 'Lemon', 'Pink Pepper'],
    personality: `A ${intensity.toLowerCase()} ${family.toLowerCase()} fragrance that captures your essence. This scent profile reflects your preference for ${questionnaire.loves_scents || 'sophisticated notes'} while avoiding ${questionnaire.avoids_scents || 'overpowering elements'}. Perfect for someone seeking ${questionnaire.desired_emotions || 'confidence and elegance'}.`,
    mixing_notes: 'Base: 30% Vanilla, 20% Sandalwood, 15% Amber. Heart: 15% Rose, 10% Jasmine, 5% Ylang Ylang. Top: 3% Bergamot, 1% Lemon, 1% Pink Pepper.',
    _isMockData: true, // Flag to indicate this is fallback data
  };
};

/**
 * Analyze customer questionnaire and generate scent profile using configured AI provider
 */
export const analyzeScentProfile = async (questionnaire: {
  loves_scents: string;
  avoids_scents: string;
  desired_emotions: string;
  favorite_memory?: string;
  lifestyle: string[];
  intensity?: number;
}): Promise<any> => {
  try {
    const prompt = `You are a master perfumer AI for MISARH, a luxury fragrance house. Analyze this customer's preferences and create a personalized scent profile.

Customer Preferences:
- Loves these scents: ${questionnaire.loves_scents}
- Avoids these scents: ${questionnaire.avoids_scents}
- Desired emotions to evoke: ${questionnaire.desired_emotions}
- Favorite memory: ${questionnaire.favorite_memory || 'Not provided'}
- Lifestyle: ${questionnaire.lifestyle.join(', ')}

Based on this, create a detailed scent profile with:
1. Dominant fragrance family (Fresh, Floral, Woody, Oriental, or Spicy)
2. Intensity level (Light, Medium, or Strong)
3. Recommended base notes (3-5 notes)
4. Recommended heart notes (3-5 notes)
5. Recommended top notes (3-5 notes)
6. Personality description of the scent
7. Mixing notes and ratios for the perfumer

Respond ONLY with valid JSON in this exact format:
{
  "dominant_family": "Oriental",
  "intensity": "Medium",
  "recommended_base": ["Amber", "Sandalwood", "Vanilla"],
  "recommended_heart": ["Rose", "Jasmine", "Ylang Ylang"],
  "recommended_top": ["Bergamot", "Lemon", "Pink Pepper"],
  "personality": "A warm, sensual fragrance that...",
  "mixing_notes": "Base: 30% Amber, 20% Sandalwood..."
}`;

    let content: string;

    if (AI_PROVIDER === 'gemini') {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      content = response.text  || '';

      // Clean up Gemini response (remove markdown code blocks if present)
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else {
      // Default to OpenAI
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert perfumer creating personalized fragrance profiles. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      content = response.choices[0]?.message?.content || '';
    }

    if (!content) {
      throw new Error(`No response from ${AI_PROVIDER} AI`);
    }

    console.log(`🤖 ${AI_PROVIDER} response:`, content);
    // Parse JSON response
    const profile = JSON.parse(content);

    return {
      dominant_family: profile.dominant_family,
      intensity: profile.intensity,
      recommended_base: profile.recommended_base,
      recommended_heart: profile.recommended_heart,
      recommended_top: profile.recommended_top,
      personality: profile.personality,
      mixing_notes: profile.mixing_notes,
    };
  } catch (error: any) {
    console.error(`${AI_PROVIDER} API error:`, error);

    // Check for provider-specific errors
    if (AI_PROVIDER === 'openai' && (error.status === 429 || error.code === 'insufficient_quota')) {
      console.warn('⚠️ OpenAI quota exceeded, using mock scent profile fallback');
    } else if (AI_PROVIDER === 'gemini' && error.message?.includes('quota')) {
      console.warn('⚠️ Gemini quota exceeded, using mock scent profile fallback');
    } else {
      console.warn(`⚠️ ${AI_PROVIDER} unavailable, using mock scent profile fallback`);
    }

    // Return mock profile instead of throwing error
    return generateMockScentProfile(questionnaire);
  }
};

/**
 * Generate custom fragrance recommendations based on profile
 */
export const generateFragranceRecommendations = async (
  profile: any,
  existingProducts: any[]
): Promise<string[]> => {
  try {
    const prompt = `As a master perfumer, recommend which of these MISARH fragrances would best match this customer's scent profile:

Customer Profile:
- Dominant Family: ${profile.dominant_family}
- Intensity: ${profile.intensity}
- Personality: ${profile.personality}

Available Fragrances:
${existingProducts.map((p, i) => `${i + 1}. ${p.name} (${p.family}) - ${p.emotion_story}`).join('\n')}

Recommend the top 2-3 fragrances and explain why they match. Respond with JSON array of product IDs only.
Example: ["uuid-1", "uuid-2"]`;

    let content: string;

    if (AI_PROVIDER === 'gemini') {
      const response = await getGeminiClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      content = response.text || '';

      // Clean up Gemini response
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else {
      // Default to OpenAI
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fragrance expert. Respond with JSON array of UUIDs only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      content = response.choices[0]?.message?.content || '';
    }

    if (!content) {
      return [];
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`Recommendation error with ${AI_PROVIDER}:`, error);
    return [];
  }
};

export default { analyzeScentProfile, generateFragranceRecommendations };

/**
 * Get current AI provider configuration
 */
export const getAIProvider = (): string => {
  return AI_PROVIDER;
};
