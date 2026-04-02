const express = require('express');
const router = express.Router();
const clothingController = require('../controllers/clothingController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, clothingController.getClothes);
router.post('/', auth, clothingController.addClothingItem);
router.put('/:id', auth, clothingController.updateClothingItem);
router.delete('/:id', auth, clothingController.deleteClothingItem);
router.get('/filter', auth, clothingController.filterClothes);

module.exports = router;
