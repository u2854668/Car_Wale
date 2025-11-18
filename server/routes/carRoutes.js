const express = require('express')
const { isAdmin, requireLogin } = require('../middleware/authMiddleware');
const {upload,createCar,getAllCar, getCarById,deleteCar,relatedCar,updatecar,braintreeTokenController,brainTreePaymentController} = require('../controllers/carController');
const formidable = require('express-formidable')

const router = express.Router()

router.get('/getAll-car',getAllCar);
router.get('/getCarById-car/:slug',getCarById);
router.post('/create-car',upload.array('productPictures',50),createCar);
router.put('/update-car/:pid',formidable(),updatecar);
router.delete('/delete-car/:pid',deleteCar);
router.get('/related-car/:cid/:bid',relatedCar)
router.get("/braintree/token", braintreeTokenController);
router.post("/braintree/payment",  brainTreePaymentController);

module.exports = router