const mongoose = require("mongoose");

const customerAddresses = new mongoose.Schema(
    {
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:true,
        },
        fullAddress: {
            type:String,
            required:true,
            maxLength:255,
        },
        mobile: {
            type:String,
            required:true,
            maxLength:50,
        },
        city: {
            type:String,
            required:false,
            maxLength:255,
        },
        district: {
            type:String,
            required:false,
            maxLength:50,
        },
        state: {
            type:String,
            required:false,
            maxLength:255,
        },
        pincode: {
            type:Number,
            required:false,
            maxLength:255,
        },
        landmark: {
            type:String,
            required:false,
            maxLength:50,
        },
        addressType: {
            type:String,
            enum:["Home", "Work"]
        }, 
        latitude: {
            type:String,
            required:false,
            maxLength:255,
        },
        longitude: {
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

module.exports = mongoose.model("CustomerAddress", customerAddresses);