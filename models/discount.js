const mongoose = require("mongoose");

const discounts = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        discountAmount: {
            type:String,
            required:false,
            maxLength:255,
        },
        discountPercentage: {
            type:String,
            required:false,
            maxLength:255,
        },
        startFrom: {
            type:Date,
            required:false,
        },
        endTo: {
            type:Date,
            required:false,
        },
        minimumOrderValue: {
            type:String,
            required:false,
            maxLength:255,
        },
        dailyTimeSlot: {
            type:String,
            required:false,
            maxLength:255,
        },
        customerType: {
            type:String,
            required:false,
            maxLength:255,
        },
        productIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required:false,
        }],
        categoryIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: false,
        }],
        quantity: [{
            type: String,
            required: false,
            maxLength:255,
        }],
        brandIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: false,
        }],
        createdAt:{
            type:Date,
            required:true,
            default:Date.now(),
        },
        updatedAt:{
            type:Date,
            required:true,
            default:Date.now(),
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false,
        },
        updatedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false,
        },


    }
);

module.exports = mongoose.model("Discount", discounts);