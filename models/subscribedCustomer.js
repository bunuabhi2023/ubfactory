const mongoose = require("mongoose");

const subscribedCustomer = new mongoose.Schema(
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
        price: {
            type:Number,
            required:true,
            maxLength:255,
        },
        startDate: {
            type:Date,
            required:false,
        },
        endDate: {
            type:Date,
            required:false,
        },
        isPaid: {
            type:Boolean,
            default:false,
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

module.exports = mongoose.model("SubscribedCustomer", subscribedCustomer);