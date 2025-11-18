const { default: slugify } = require('slugify');
const brandModel = require('../models/carBrand');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ------------------- MULTER CONFIG -------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // local folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// ------------------- CREATE BRAND -------------------
const createBrand = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.send({ message: 'Brand Name is Required' });
        }
        if (!req.file) {
            return res.send({ message: 'Brand Image is Required' });
        }

        const existCategory = await brandModel.findOne({ name });
        if (existCategory) {
            return res.status(200).send({
                success: true,
                message: 'Name Already Exists',
            });
        }

        const brand = new brandModel({
            name,
            slug: slugify(name),
            brandPictures: req.file.filename   // <-- ONLY LOCAL FILE
        });

        await brand.save();

        res.status(201).send({
            success: true,
            message: 'Brand Created Successfully',
            brand
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: 'Error in creating Brand',
            err,
        });
    }
};

// ------------------- GET ALL BRANDS -------------------
const getBrand = async (req, res) => {
    try {
        const brands = await brandModel.find({}).populate('carInvoleInThisBrand');

        const updatedBrands = brands.map(brand => {
            return {
                ...brand._doc,
                brandPictures: `${req.protocol}://${req.get('host')}/uploads/${brand.brandPictures}`
            };
        });

        res.status(200).send({
            success: true,
            totalBrand: updatedBrands.length,
            message: "All Brands",
            brands: updatedBrands
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Getting Brand",
            err
        });
    }
};

// ------------------- GET BRAND BY ID -------------------
const getBrandById = async (req, res) => {
    try {
        const brand = await brandModel.findOne({ slug: req.params.slug }).populate('carInvoleInThisBrand');

        if (!brand) {
            return res.status(404).send({
                success: false,
                message: "Brand not found"
            });
        }

        const finalBrand = {
            ...brand._doc,
            brandPictures: `${req.protocol}://${req.get('host')}/uploads/${brand.brandPictures}`
        };

        res.status(200).send({
            success: true,
            message: "Brand By this Id",
            brand: finalBrand
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Finding Brand Id",
            err
        });
    }
};

// ------------------- UPDATE BRAND -------------------
const updateBrand = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;

        const brand = await brandModel.findByIdAndUpdate(
            id,
            { name, slug: slugify(name) },
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Brand Updated Successfully",
            brand
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Updating Brand",
            err
        });
    }
};

// ------------------- DELETE BRAND -------------------
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await brandModel.findById(id);
        if (brand && brand.brandPictures) {
            const filePath = path.join(__dirname, "../uploads/", brand.brandPictures);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // delete local file
            }
        }

        await brandModel.findByIdAndDelete(id);

        res.status(200).send({
            success: true,
            message: "Brand Deleted Successfully"
        });

    } catch (err) {
        res.status(500).send({
            success: false,
            message: "Error in Deleting Brand",
            err
        });
    }
};

module.exports = {
    getBrand,
    getBrandById,
    createBrand,
    upload,
    updateBrand,
    deleteBrand
};
