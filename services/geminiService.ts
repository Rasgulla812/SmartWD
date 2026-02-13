import { WardrobeItem } from '../types';
const MODEL_NAME = 'gemini-2.5-flash';
let ai: any;

const getAPIKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (envKey && envKey !== 'YOUR_API_KEY_HERE') {
    return envKey;
  }

  console.error('VITE_GEMINI_API_KEY not found in environment.');
  throw new Error("Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file and restart the dev server.");
};

const initializeAI = async () => {
  if (ai) {
    return ai;
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const API_KEY = getAPIKey();
    console.log('Initializing GoogleGenerativeAI with API key:', `${API_KEY.substring(0, 10)}...`);
    ai = new GoogleGenerativeAI(API_KEY);
    console.log('AI initialized successfully');
    return ai;
  } catch (error) {
    console.error("Failed to initialize AI:", error);
    throw error;
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



const handleAIError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    throw new Error(`API Quota Reached: You've hit the Gemini free tier limit. Please wait a moment or check your Google AI Studio dashboard. Switching to a different model or enabling billing usually helps.`);
  }

  throw new Error(`Failed to ${context}: ${message}`);
};

export interface StyleRating {
  score: number;
  explanation: string;
}

export const rateOutfit = async (description: string, venue: string, weather: string, preference: string, strict: boolean = false): Promise<StyleRating> => {
  if (!ai) await initializeAI();

  try {
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

    const model = ai.getGenerativeModel({ model: MODEL_NAME });
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
  } catch (error) {
    return handleAIError(error, 'rate outfit');
  }
};

export const classifyImage = async (file: File): Promise<{ name: string; color: string; fabric: string; texture: string }> => {
  if (!ai) await initializeAI();

  try {
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

    const model = ai.getGenerativeModel({
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

    // Some versions of the SDK/Model might still return markdown blocks even in JSON mode
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
  } catch (error) {
    return handleAIError(error, 'classify image');
  }
};

export const recommendOutfit = async (wardrobeItems: WardrobeItem[]): Promise<string> => {
  if (!ai) await initializeAI();

  if (wardrobeItems.length === 0) {
    return "Your wardrobe is empty! Add some clothes to get an outfit recommendation.";
  }

  try {
    const itemDescriptions = wardrobeItems.map(item =>
      `${item.name}${item.color ? ` (Color: ${item.color})` : ''}${item.fabric ? ` (Fabric: ${item.fabric})` : ''}${item.texture ? ` (Texture: ${item.texture})` : ''}`
    );
    const prompt = `From the following list of clothes in a wardrobe, recommend a stylish and coherent outfit for today. Provide a brief description of the outfit and why it works well together.\n\nWardrobe items:\n- ${itemDescriptions.join('\n- ')}\n\nRecommendation:`;

    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    return result.text() || "Unable to generate recommendation";
  } catch (error) {
    return handleAIError(error, 'generate recommendation');
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!ai) await initializeAI();

  try {
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
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
  } catch (error) {
    return handleAIError(error, 'generate image');
  }
};
