const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash-lite'; // Optimized for speed and quality

let genAI;

let currentKeyIndex = 0;

const getAI = () => {
    const rawKeys = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!rawKeys) {
        throw new Error('GEMINI_API_KEY or VITE_GEMINI_API_KEY is not configured in backend .env');
    }
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

    // For simplicity, we use the first available key, 
    // or we could implement rotation here if needed.
    const apiKey = apiKeys[currentKeyIndex];
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

exports.classifyClothing = async (base64Image) => {
    const ai = getAI();
    const model = ai.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: "You are a world-class textile and fashion expert. You can identify any fabric or texture just by looking at a photo. You only output pure JSON."
    });

    // Remove data:image/...;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `Identify the attributes of this clothing item with absolute precision. 
      Requirements for fields:
      - 'name': Specific fashion name (e.g., 'Oversized Cuban Collar Shirt')
      - 'color': The dominant color with shades (e.g., 'Deep Forest Green')
      - 'fabric': The specific material composition (e.g., 'Heavyweight Cotton Twill', 'Merino Wool', 'Synthetic Mesh', 'Nylon', 'Linen Blend')
      - 'texture': Describe the surface feel and look (e.g., 'Waffle Knit', 'Seersucker', 'Brushed/Fuzzy', 'Matte/Flat', 'Mercerized/Glossy', 'Herringbone Weave')
      - 'category': One of ['Top', 'Bottom', 'Footwear', 'Outerwear', 'Accessories']
      - 'season': One of ['Summer', 'Winter', 'Spring', 'Fall', 'All']
      
      Respond STRICTLY in JSON format.`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
            }
        }
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean JSON if it's wrapped in code blocks
    if (text.includes('```')) {
        text = text.replace(/```json\n?|```/g, '').trim();
    }

    return JSON.parse(text);
};

exports.generateRecommendation = async (clothes, context = {}, recent = []) => {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const itemDescriptions = clothes.map(item =>
        `${item.name} (${item.color}, ${item.fabric}, ${item.texture})`
    ).join('\n - ');

    const prompt = `You are a professional fashion stylist. Here is a user's wardrobe:
    ${itemDescriptions}

    Context:
    - Occasion: ${context.occasion || 'Any'}
    - Weather: ${context.weather || 'Any'}
    - Style: ${context.style || 'Any'}

    Recent suggestions: ${recent.join(', ')}

    Create a stylish outfit and explain why it works.
    Provide your response in a friendly, professional tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

exports.rateOutfit = async (description, venue, weather, preference, strict) => {
    const ai = getAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Rate the following outfit:
    Description: ${description}
    Venue: ${venue}
    Weather: ${weather}
    Style Preference: ${preference}
    ${strict ? 'STRICT MODE: Be very critical and honest.' : ''}
    
    Provide a score (1-10) and a detailed critique in JSON format: {"score": 8, "explanation": "..."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    if (text.includes('```')) {
        text = text.replace(/```json\n?|```/g, '').trim();
    }
    return JSON.parse(text);
};

exports.generateLookbook = async (wardrobeItems) => {
    const ai = getAI();
    const model = ai.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json" }
    });

    const itemDescriptions = wardrobeItems.map(item =>
        `${item.name} (${item.color}, ${item.fabric}, ${item.texture})`
    ).join('\n - ');

    const prompt = `Generate 5 unique outfit combinations using these clothes:
    ${itemDescriptions}
    
    Format as JSON array: [{"title": "...", "description": "..."}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};
