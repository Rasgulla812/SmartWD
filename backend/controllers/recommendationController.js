const ClothingItem = require('../models/ClothingItem');
const aiService = require('../services/aiService');

// @desc    Recommend outfit using AI
exports.recommendOutfit = async (req, res) => {
    const { occasion, weather, style, recent } = req.body;

    try {
        const clothes = await ClothingItem.find({ user: req.user.id });

        if (clothes.length === 0) {
            return res.status(400).json({ msg: 'Your wardrobe is empty' });
        }

        const lastRecommendations = Array.isArray(recent) ? recent : (recent ? recent.split(',') : []);

        const recommendation = await aiService.generateRecommendation(
            clothes, 
            { occasion, weather, style },
            lastRecommendations
        );

        res.json({ recommendation });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
