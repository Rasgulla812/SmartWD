const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, recommendationController.recommendOutfit);

module.exports = router;
