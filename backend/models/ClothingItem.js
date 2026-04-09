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
        required: false,
        default: 'Top'
    },
    color: {
        type: String,
        required: true
    },
    fabric: {
        type: String
    },
    texture: {
        type: String
    },
    occasion: {
        type: String
    },
    season: {
        type: String,
        required: false,
        default: 'All'
    },
    image: {
        type: String // We'll store URL or Base64
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema);
