const mongoose = require("mongoose");

const products = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 255,
    },
    description: {
        type: String,
        required: true,
        maxLength: 255,
    },
    prices: {
        type: String,
        required: true,
        maxLength: 255,
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: false,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    file: {
        type: String,
        required: false,
        maxLength: 255,
    },
    extraFiles: [{
        type: String,
        required: false,
        maxLength: 255,
    }],
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

module.exports = mongoose.model("Product", products);
