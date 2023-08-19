const mongoose = require("mongoose");

const carts = new mongoose.Schema({
    customerId: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    cartDetails: [{  
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        sizeId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Size',
            required: true,
        },
        quantity:{
            type: Number,
            required: true,
        },
        price:{
            type: String,
            required: true,
            maxLength: 255,
        },
    }],
    cartCount: {
        type: Number,
        required: false,
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
    isOrdered: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Cart", carts);
