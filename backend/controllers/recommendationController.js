const ClothingItem = require('../models/ClothingItem');

// @desc    Recommend outfit based on season
exports.recommendOutfit = async (req, res) => {
    const { season } = req.query; // 'Summer', 'Winter', etc.

    if (!season) {
        return res.status(400).json({ msg: 'Please provide a season for recommendation' });
    }

    try {
        // Fetch user's clothes that match the season or 'All'
        const clothes = await ClothingItem.find({
            user: req.user.id,
            season: { $in: [season, 'All'] }
        });

        // Basic recommendation logic
        const tops = clothes.filter(item => item.category === 'Top');
        const bottoms = clothes.filter(item => item.category === 'Bottom');
        const footwears = clothes.filter(item => item.category === 'Footwear');
        
        let outwear = null;
        if (season === 'Winter' || season === 'Fall') {
            const outwears = clothes.filter(item => item.category === 'Outerwear');
            if (outwears.length > 0) {
                outwear = outwears[Math.floor(Math.random() * outwears.length)];
            }
        }

        if (tops.length === 0 || bottoms.length === 0) {
            return res.status(400).json({ 
                msg: 'Not enough clothes for a full outfit recommendation (need at least a top and a bottom).' 
            });
        }

        // Randomly select one of each
        const recommendedTop = tops[Math.floor(Math.random() * tops.length)];
        const recommendedBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        let recommendedFootwear = null;
        if (footwears.length > 0) {
            recommendedFootwear = footwears[Math.floor(Math.random() * footwears.length)];
        }

        const outfit = {
            top: recommendedTop,
            bottom: recommendedBottom,
            footwear: recommendedFootwear,
            outerwear: outwear
        };

        res.json(outfit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
