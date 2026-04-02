const mongoose = require('mongoose');

const ClothingItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Top', 'Bottom', 'Footwear', 'Outerwear', 'Accessories']
    },
    color: {
        type: String,
        required: true
    },
    season: {
        type: String,
        required: true,
        enum: ['Summer', 'Winter', 'Spring', 'Fall', 'All']
    },
    image: {
        type: String // URL to image if stored in S3/Cloudinary or local path
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema);
