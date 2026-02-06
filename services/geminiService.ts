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

export const classifyImage = async (file: File): Promise<string> => {
  if (!ai) {
    await initializeAI();
  }
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: "Analyze this image of a clothing item. Provide a short, descriptive name for it (e.g., 'blue denim jacket', 'striped cotton t-shirt', 'black leather boots'). Respond with only the name.",
    };
    const model = ai.getGenerativeModel({ model: 'gemini-.5-flash' });
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

export interface StyleRating {
  score: number;
  explanation: string;
  tips: string[];
}

export const rateOutfit = async (
  description: string,
  venue: string,
  weather: string,
  preference: string
): Promise<StyleRating> => {
  if (!ai) {
    await initializeAI();
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Act as a high-end professional fashion consultant and style critic. 
      Rate the following outfit description based on the provided context.
      
      Outfit Description: "${description}"
      Venue/Occasion: "${venue}"
      Weather: "${weather}"
      User Preference/Style: "${preference}"
      
      Provide your response in a clear JSON-like format (but as plain text) with:
      1. A score from 1-10.
      2. A detailed professional explanation.
      3. 3-4 specific style tips to make it "super cool" yet professional.
      
      Be sophisticated, encouraging, but honest.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Simple parsing logic or just return as structured object if we trust AI formatting
    // For robustness, let's ask for specific markers
    const scoreMatch = text.match(/Score:\s*(\d+)/i) || text.match(/(\d+)\/10/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;

    return {
      score,
      explanation: text,
      tips: [] // Tips are included in the explanation text for now
    };
  } catch (error) {
    console.error("Error rating outfit:", error);
    throw new Error(`Failed to rate outfit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
