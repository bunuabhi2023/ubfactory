const mongoose = require("mongoose");

const transction = new mongoose.Schema(
    {
        orderNo:{
            type:String,
            required:true,
            maxLength:255,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:true,
        },
        planId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plan',
            required:true,
        },
        razorpayPaymentId: {
            type:String,
            required:false,
            maxLength:255,
        },
        razorpayOrderId: {
            type:String,
            required:false,
            maxLength:255,
        },
        razorpaySignature: {
            type:String,
            required:false,
            maxLength:255,
        },
        amount: {
            type:String,
            required:false,
            maxLength:255,
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

module.exports = mongoose.model("Transaction", transction);