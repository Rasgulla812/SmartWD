import { WardrobeItem } from '../types';

const getAuthToken = () => localStorage.getItem('auth_token');

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-auth-token': token } : {}),
  };
};

export interface StyleRating {
  score: number;
  explanation: string;
}

export interface MultiOutfitResult {
  title: string;
  description: string;
}

export const classifyImage = async (file: File): Promise<{ name: string; color: string; fabric: string; texture: string; category?: string; season?: string }> => {
  // Convert file to base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const base64Image = await base64Promise;

  const res = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ image: base64Image }),
  });

  if (!res.ok) throw new Error('AI Classification failed');
  return await res.json();
};

export const recommendOutfit = async (items: WardrobeItem[], context: any, recent: string[] = []): Promise<string> => {
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, context, recent })
    });

    // FIX: Check if the response is actually OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server Error Details:", errorText);
      throw new Error("The AI Stylist is currently unavailable.");
    }

    const data = await response.json();
    if (data.recommendation) {
      return data.recommendation;
    }
    if (data.error) throw new Error(data.error);
    return "Unable to generate recommendation at this time.";
  } catch (error: any) {
    console.error("Outfit Gen Error:", error);
    return `Error: ${error.message || "Could not generate outfit."}`;
  }
};

// These two could also be moved to backend, but for now I'll leave them as placeholders 
// or implement them if they are critical. The user primarily used wardrobe and recommender.
export const rateOutfit = async (description: string, venue: string, weather: string, preference: string, strict: boolean = false): Promise<StyleRating> => {
  const res = await fetch('/api/ai/rate', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ description, venue, weather, preference, strict }),
  });

  if (!res.ok) throw new Error('Style Rating failed');
  return await res.json();
};

export const generateAllPossibleOutfits = async (wardrobeItems: WardrobeItem[]): Promise<MultiOutfitResult[]> => {
  const res = await fetch('/api/ai/lookbook', {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error('Lookbook generation failed');
  return await res.json();
};

export const generateImage = async (prompt: string): Promise<string> => {
  throw new Error("Image generation not yet implemented on backend");
};
