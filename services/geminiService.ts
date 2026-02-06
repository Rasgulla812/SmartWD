let ai: any;

const getAPIKey = (): string => {
  // Try environment variable first (Vite exposes VITE_ prefixed vars)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Fallback to window object (set in HTML)
  const windowKey = (window as any).GOOGLE_API_KEY;

  console.log('API Key source:', envKey ? 'environment' : windowKey ? 'window' : 'NOT FOUND');
  console.log('API Key found:', windowKey ? `${windowKey.substring(0, 10)}...` : 'NOT SET');

  if (!windowKey || windowKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  return windowKey;
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

export interface StyleRating {
  score: number;
  explanation: string;
}

export const rateOutfit = async (description: string, venue: string, weather: string, preference: string): Promise<StyleRating> => {
  if (!ai) {
    await initializeAI();
  }

  try {
    const prompt = `Rate the following outfit based on the context:
    Description: ${description}
    Venue: ${venue}
    Weather: ${weather}
    Style Preference: ${preference}
    
    Provide a score between 1 and 10 and a detailed professional critique.
    Format your response as a JSON object like this:
    {
      "score": 8,
      "explanation": "Your detailed critique here..."
    }`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    const text = result.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid response format from AI");
  } catch (error) {
    console.error("Error rating outfit:", error);
    throw new Error(`Failed to rate outfit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const classifyImage = async (file: File): Promise<string> => {
  if (!ai) {
    await initializeAI();
  }
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: "Analyze this image of a clothing item. Provide a short, descriptive name for it (e.g., 'blue denim jacket', 'striped cotton t-shirt', 'black leather boots'). Respond with only the name.",
    };
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent({
      contents: [{ parts: [imagePart, textPart] }]
    });

    const result = await response.response;
    const text = result.text();
    return text.trim() || "Clothing item";
  } catch (error) {
    console.error("Error classifying image:", error);
    throw new Error(`Failed to classify the image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const recommendOutfit = async (wardrobeItems: string[]): Promise<string> => {
  if (!ai) {
    await initializeAI();
  }
  if (wardrobeItems.length === 0) {
    return "Your wardrobe is empty! Add some clothes to get an outfit recommendation.";
  }

  try {
    const prompt = `From the following list of clothes in a wardrobe, recommend a stylish and coherent outfit for today. Provide a brief description of the outfit and why it works well together.\n\nWardrobe items:\n- ${wardrobeItems.join('\n- ')}\n\nRecommendation:`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const result = await response.response;
    return result.text() || "Unable to generate recommendation";
  } catch (error) {
    console.error("Error recommending outfit:", error);
    throw new Error(`Failed to generate recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!ai) {
    await initializeAI();
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

    throw new Error("No image data in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
