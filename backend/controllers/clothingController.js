const ClothingItem = require('../models/ClothingItem');

// @desc    Get all clothing items
exports.getClothes = async (req, res) => {
    try {
        const clothes = await ClothingItem.find({ user: req.user.id }).sort({ dateAdded: -1 });
        res.json(clothes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add new clothing item
exports.addClothingItem = async (req, res) => {
    const { name, category, color, season, image } = req.body;

    try {
        const newItem = new ClothingItem({
            name,
            category,
            color,
            season,
            image,
            user: req.user.id
        });

        const item = await newItem.save();
        res.status(201).json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update clothing item
exports.updateClothingItem = async (req, res) => {
    const { name, category, color, season, image } = req.body;

    // Build item object
    const itemFields = {};
    if (name) itemFields.name = name;
    if (category) itemFields.category = category;
    if (color) itemFields.color = color;
    if (season) itemFields.season = season;
    if (image) itemFields.image = image;

    try {
        let item = await ClothingItem.findById(req.params.id);

        if (!item) return res.status(404).json({ msg: 'Item not found' });

        // Make sure user owns item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        item = await ClothingItem.findByIdAndUpdate(
            req.params.id,
            { $set: itemFields },
            { new: true }
        );

        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete clothing item
exports.deleteClothingItem = async (req, res) => {
    try {
        let item = await ClothingItem.findById(req.params.id);

        if (!item) return res.status(404).json({ msg: 'Item not found' });

        // Make sure user owns item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await ClothingItem.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get clothing items by category/season/color
exports.filterClothes = async (req, res) => {
    const { season, color, category } = req.query;

    const query = { user: req.user.id };
    if (season) query.season = season;
    if (color) query.color = color;
    if (category) query.category = category;

    try {
        const clothes = await ClothingItem.find(query);
        res.json(clothes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
