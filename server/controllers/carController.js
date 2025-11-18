const { default: slugify } = require("slugify")
const carModel = require("../models/carModel")
const orderModel = require("../models/orderModel")
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const dotenv = require("dotenv")
const brandModel = require("../models/carBrand")
const braintree = require("braintree");

dotenv.config()

// ======================= MULTER STORAGE ===========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // save images locally
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// ======================= BRAINTREE CONFIG =========================
var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

// ======================= CREATE CAR ================================
const createCar = async (req, res) => {
    try {
        const {
            name, description, brand, price,
            fuelType, transmission, engineSize, mileage,
            safetyrating, warranty, seater, size, fuelTank
        } = req.body;

        const requiredFields = [
            'name','description','brand','price','fuelType','transmission',
            'engineSize','mileage','safetyrating','warranty','seater','size','fuelTank'
        ];

        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).send({ success: false, message: `${field} is required` });
            }
        }

        // save image URL path
        const productImages = req.files.map(file => {
            return `${process.env.SERVER_URL}/uploads/${file.filename}`;
        });

        const slug = slugify(name);

        const car = new carModel({
            name,
            slug,
            description,
            brand,
            productPictures: productImages,
            price,
            fuelType,
            transmission,
            engineSize,
            mileage,
            safetyrating,
            warranty,
            seater,
            size,
            fuelTank
        });

        await car.save();

        const category = await brandModel.findById(brand);
        category.carInvoleInThisBrand.push(car);
        await category.save();

        res.status(201).send({
            success: true,
            message: "Car Created Successfully",
            car
        });

    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "Error in creating Car",
            error: err.message
        });
    }
};

// ======================= GET ALL CARS ===============================
const getAllCar = async (req, res) => {
    try {
        const cars = await carModel.find({}).populate("brand");

        res.status(200).send({
            success: true,
            totalCar: cars.length,
            message: "All Cars",
            cars
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Getting Cars",
            error: err.message
        });
    }
};

// ======================= GET CAR BY SLUG ============================
const getCarById = async (req, res) => {
    try {
        const car = await carModel.findOne({ slug: req.params.slug }).populate("brand");

        res.status(200).send({
            success: true,
            message: "Car By this ID",
            car
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Finding Car ID",
            err
        });
    }
};

// ======================= DELETE CAR =================================
const deleteCar = async (req, res) => {
    try {
        const car = await carModel.findById(req.params.pid);

        // remove images from local folder
        try {
            car.productPictures.forEach(url => {
                const filepath = path.join("uploads", url.split("/uploads/")[1]);
                fs.unlink(filepath, (err) => {
                    if (err) console.log("Delete image error:", err);
                });
            });
        } catch (e) {
            console.log("Delete Error:", e);
        }

        await carModel.findByIdAndDelete(req.params.pid);

        res.status(200).send({
            success: true,
            message: "Car Deleted Successfully"
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Deleting Car",
            err
        });
    }
};

// ======================= UPDATE CAR =================================
const updatecar = async (req, res) => {
    try {
        const { name } = req.body;

        const car = await carModel.findByIdAndUpdate(
            req.params.pid,
            { ...req.body, slug: slugify(name) },
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Car Updated Successfully",
            car
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Updating Car",
            err
        });
    }
};

// ======================= RELATED CAR =================================
const relatedCar = async (req, res) => {
    try {
        const { cid, bid } = req.params;

        const cars = await carModel.find({
            brand: bid,
            _id: { $ne: cid }
        }).populate("brand");

        res.status(200).send({
            success: true,
            message: "Related Cars",
            cars
        });

    } catch (err) {
        res.status(400).send({
            success: false,
            message: "Error While Fetching Related Cars",
            err
        });
    }
};

// ======================= BRAINTREE TOKEN =============================
const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, (err, response) => {
            if (err) return res.status(500).send(err);
            res.send(response);
        });
    } catch (error) {
        console.log(error);
    }
};

// ======================= BRAINTREE PAYMENT ============================
const brainTreePaymentController = async (req, res) => {
    try {
        const { nonce, cart } = req.body;

        let total = 0;
        cart.map(i => total += i.price);

        gateway.transaction.sale({
            amount: total,
            paymentMethodNonce: nonce,
            options: { submitForSettlement: true }
        }, async (error, result) => {
            if (result) {
                await new orderModel({
                    products: cart,
                    payment: result,
                    buyer: req.user._id
                }).save();

                res.json({ ok: true });

            } else {
                res.status(500).send(error);
            }
        });

    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    upload,
    createCar,
    getAllCar,
    getCarById,
    deleteCar,
    updatecar,
    relatedCar,
    braintreeTokenController,
    brainTreePaymentController
};
