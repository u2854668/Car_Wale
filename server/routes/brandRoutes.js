const express = require('express')
const { requireLogin, isAdmin } = require('../middleware/authMiddleware');
const {createBrand,updateBrand,deleteBrand, getBrand, getBrandById,upload} = require('../controllers/brandController');

const router = express.Router();

router.get('/getAll-brand',getBrand);
router.get('/getBrandBtId-brand/:slug',getBrandById);
router.post('/create-brand',upload.single('brandPictures'),createBrand);
router.put('/update-brand/:id',updateBrand);
router.delete('/delete-brand/:id',deleteBrand);

module.exports = router