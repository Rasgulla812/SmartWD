import { WardrobeItem } from '../types';
const MODEL_NAME = 'gemini-2.5-flash';
let ai: any;
let apiKeys: string[] = [];
let currentKeyIndex = 0;

const getAPIKeys = (): string[] => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (envKey && envKey !== 'YOUR_API_KEY_HERE') {
    return envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  console.error('VITE_GEMINI_API_KEY not found in environment.');
  throw new Error("Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file. Multiple keys can be comma-separated.");
};

const initializeAI = async (forceNext = false) => {
  if (apiKeys.length === 0) {
    apiKeys = getAPIKeys();
  }

  if (forceNext) {
    currentKeyIndex++;
    if (currentKeyIndex >= apiKeys.length) {
      throw new Error(`All API keys exhausted.`);
    }
    console.log(`Switching to backup API key... (Key ${currentKeyIndex + 1} of ${apiKeys.length})`);
  } else if (ai && !forceNext) {
    return ai;
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const API_KEY = apiKeys[currentKeyIndex];
    console.log(`Initializing GoogleGenerativeAI with key ${currentKeyIndex + 1}:`, `${API_KEY.substring(0, 5)}...`);
    ai = new GoogleGenerativeAI(API_KEY);
    console.log(`AI initialized successfully with key ${currentKeyIndex + 1}`);
    return ai;
  } catch (error) {
    console.error("Failed to initialize AI:", error);
    throw error;
  }
};

const executeWithFallback = async <T>(operation: (aiInstance: any) => Promise<T>, context: string): Promise<T> => {
  if (!ai) await initializeAI();

  while (true) {
    try {
      return await operation(ai);
    } catch (error: any) {
      console.error(`Error in ${context} with key ${currentKeyIndex + 1}:`, error);
      const message = error?.message || 'Unknown error';
      
      const isKeyError = message.includes('429') || 
                         message.toLowerCase().includes('quota') || 
                         message.toLowerCase().includes('api key') || 
                         message.includes('403') ||
                         message.includes('503');
                         
      if (isKeyError) {
        if (currentKeyIndex + 1 < apiKeys.length) {
          console.warn(`API issue encountered: ${message}. Switching to next API key...`);
          await initializeAI(true);
          continue;
        } else {
          if (message.includes('429') || message.toLowerCase().includes('quota')) {
            throw new Error(`API Quota Reached for all available keys. Please wait a moment or check your Google AI Studio dashboard.`);
          } else {
            throw new Error(`All API keys failed for ${context}. Last error: ${message}`);
          }
        }
      }
      
      throw new Error(`Failed to ${context}: ${message}`);
    }
  }
};

// Utility function to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export interface StyleRating {
  score: number;
  explanation: string;
}

export const rateOutfit = async (description: string, venue: string, weather: string, preference: string, strict: boolean = false): Promise<StyleRating> => {
  const prompt = `Rate the following outfit based on the context:
    Description: ${description}
    Venue: ${venue}
    Weather: ${weather}
    Style Preference: ${preference}
    ${strict ? 'STRICT MODE: Be very critical and honest. Don\'t hold back on suggesting improvements even if the outfit is good.' : 'Be encouraging but professional.'}
    
    Provide a score between 1 and 10 and a detailed professional critique.
    Format your response as a JSON object like this:
    {
      "score": 8,
      "explanation": "Your detailed critique here..."
    }`;

  return executeWithFallback(async (aiInstance) => {
    const model = aiInstance.getGenerativeModel({ model: MODEL_NAME });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    const text = result.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid response format from AI");
  }, 'rate outfit');
};

export const classifyImage = async (file: File): Promise<{ name: string; color: string; fabric: string; texture: string }> => {
  const imagePart = await fileToGenerativePart(file);
  const textPart = {
    text: `Identify the attributes of this clothing item with absolute precision. 
      You must focus on the subtle visual cues to determine the exact material and surface texture.
      
      Requirements for fields:
      - 'name': Specific fashion name (e.g., 'Oversized Cuban Collar Shirt')
      - 'color': The dominant color with shades (e.g., 'Deep Forest Green')
      - 'fabric': The specific material composition (e.g., 'Heavyweight Cotton Twill', 'Merino Wool', 'Synthetic Mesh', 'Nylon', 'Linen Blend'). NEVER say just 'Fabric' or 'Unknown'.
      - 'texture': Describe the surface feel and look (e.g., 'Waffle Knit', 'Seersucker', 'Brushed/Fuzzy', 'Matte/Flat', 'Mercerized/Glossy', 'Herringbone Weave'). NEVER say 'Unknown'.
      
      Respond STRICTLY in JSON format.`,
  };

  return executeWithFallback(async (aiInstance) => {
    const model = aiInstance.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: "You are a world-class textile and fashion expert. You can identify any fabric or texture just by looking at a photo. You only output pure JSON."
    });

    const response = await model.generateContent({
      contents: [{ parts: [imagePart, textPart] }],
      generationConfig: {
        temperature: 0.1, // Low temperature for higher accuracy/consistency
        responseMimeType: "application/json",
      }
    });

    const result = await response.response;
    let text = result.text();
    console.log('Gemini raw response:', text);

    if (text.includes('```')) {
      text = text.replace(/```json\n?|```/g, '').trim();
    }

    const parsed = JSON.parse(text);
    return {
      name: parsed.name || parsed.item_name || "Clothing Item",
      color: parsed.color || "Specific Color",
      fabric: parsed.fabric || parsed.material || "Specific Fabric",
      texture: parsed.texture || "Specific Texture"
    };
  }, 'classify image');
};

export const recommendOutfit = async (
  wardrobeItems: WardrobeItem[],
  context?: { occasion?: string; weather?: string; mood?: string; style?: string },
  recentRecommendations?: string[]
): Promise<string> => {
  if (wardrobeItems.length === 0) {
    return "Your wardrobe is empty! Add some clothes to get an outfit recommendation.";
  }

  const itemDescriptions = wardrobeItems.map(item =>
    `${item.name}${item.color ? ` (Color: ${item.color})` : ''}${item.fabric ? ` (Fabric: ${item.fabric})` : ''}${item.texture ? ` (Texture: ${item.texture})` : ''}`
  );

  let prompt = `You are a professional fashion stylist. Below is a list of ALL available clothes in a user's wardrobe. 
    Your task is to create a STYLISH and COHERENT outfit recommendation.
    
    IMPORTANT RULES:
    1. EXPLOIT THE FULL WARDROBE: Don't just pick the first few items. Rotate through different items. If there are multiple similar items (like two different jeans), make sure to suggest the one that hasn't been featured recently.
    2. BE CREATIVE: Mix and match items in interesting ways.
    3. PROVIDE A CLEAR DESCRIPTION: Name the specific items and explain why they work together.

    Available Wardrobe items:
    - ${itemDescriptions.join('\n    - ')}\n\n`;

  if (recentRecommendations && recentRecommendations.length > 0) {
    prompt += `CRITICAL: The user did NOT like the previous recommendations. DO NOT SUGGEST ANYTHING SIMILAR TO THESE:
      ${recentRecommendations.slice(-3).join('\n---\n')}
      
      You MUST provide a significantly DIFFERENT combination this time using other available items.\n\n`;
  }

  if (context) {
    prompt += "Please consider the following specific preferences:\n";
    if (context.occasion) prompt += `- Occasion: ${context.occasion}\n`;
    if (context.weather) prompt += `- Weather: ${context.weather}\n`;
    if (context.mood) prompt += `- Mood: ${context.mood}\n`;
    if (context.style) prompt += `- Style Preference: ${context.style}\n`;
    prompt += "\n";
  }

  prompt += "Provide your recommendation now:";

  return executeWithFallback(async (aiInstance) => {
    const model = aiInstance.getGenerativeModel({ model: MODEL_NAME });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    return result.text() || "Unable to generate recommendation";
  }, 'generate recommendation');
};

export interface MultiOutfitResult {
  title: string;
  description: string;
}

export const generateAllPossibleOutfits = async (wardrobeItems: WardrobeItem[]): Promise<MultiOutfitResult[]> => {
  if (wardrobeItems.length === 0) {
    throw new Error("Your wardrobe is empty!");
  }

  const itemDescriptions = wardrobeItems.map(item =>
    `${item.name}${item.color ? ` (Color: ${item.color})` : ''}${item.fabric ? ` (Fabric: ${item.fabric})` : ''}${item.texture ? ` (Texture: ${item.texture})` : ''}`
  );

  const prompt = `You are a creative fashion stylist. Here is a list of ALL available clothes in a user's wardrobe:
    - ${itemDescriptions.join('\n    - ')}

    Your task is to generate 5-8 UNIQUE and DIVERSE outfit combinations using DIFFERENT pieces from the wardrobe. 
    Make sure to include combinations for different vibes (e.g., casual, smart, edgy, cozy).
    Use as many items from the wardrobe as possible across all combinations.

    Format your response STRICTLY as a JSON array of objects, where each object has "title" (short vibe name) and "description" (detailed outfit description).
    Example: [{"title": "Casual Minimalist", "description": "Combining the white tee with raw denim..."}, ...]`;

  return executeWithFallback(async (aiInstance) => {
    const model = aiInstance.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    const text = result.text();
    return JSON.parse(text);
  }, 'generate all outfits');
};

export const generateImage = async (prompt: string): Promise<string> => {
  return executeWithFallback(async (aiInstance) => {
    const model = aiInstance.getGenerativeModel({ model: MODEL_NAME });
    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Generate a high-quality, photorealistic image of a clothing item or outfit: ${prompt}. The item should be displayed on a neutral, clean background.`
        }]
      }]
    });

    const result = await response.response;
    const content = result.candidates?.[0]?.content;

    if (content?.parts) {
      for (const part of content.parts) {
        if ('inlineData' in part && part.inlineData?.data) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data in response. Note: This model may not support direct image generation.");
  }, 'generate image');
};
