const mongoose = require("mongoose");

const vendorProducts = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    sizeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    totalStock: {
        type: Number,
        required: false,
        default: 0,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
});

module.exports = mongoose.model("VendorProduct", vendorProducts);
