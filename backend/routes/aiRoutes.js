const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const auth = require('../middleware/authMiddleware');

// @route   POST api/ai/classify
// @desc    Classify clothing image
// @access  Private
router.post('/classify', auth, async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ msg: 'Please upload an image' });
    }

    try {
        const result = await aiService.classifyClothing(image);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', details: err.message });
    }
});

// @route   POST api/ai/rate
// @desc    Rate an outfit
router.post('/rate', auth, async (req, res) => {
    const { description, venue, weather, preference, strict } = req.body;
    try {
        const result = await aiService.rateOutfit(description, venue, weather, preference, strict);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/ai/lookbook
// @desc    Generate lookbook from wardrobe
router.post('/lookbook', auth, async (req, res) => {
    try {
        const ClothingItem = require('../models/ClothingItem');
        const clothes = await ClothingItem.find({ user: req.user.id });
        const result = await aiService.generateLookbook(clothes);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
