const mongoose = require("mongoose");

const requests = new mongoose.Schema(
    {
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required:false,
        },
        sizeId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Size',
            required:false,
        },
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },
        requiredQuantity:{
            type: Number,
            required: true,

        },
        status:{
            type: String,
            enum:["pending", "accepted", "approved", "rejected", "completed"],
            default: "pending"
        },
        createdAt:{
            type:Date,
            required:true,
            default:Date.now(),
        },
        updatedAt:{
            type:Date,
            required:true,
            default:Date.now(),
        }
    }
);

module.exports = mongoose.model("Request", requests);