const mongoose = require("mongoose");

const users = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        email: {
            type:String,
            required:true,
            maxLength:255,
        },
        password: {
            type:String,
            required:true,
            maxLength:255,
        },
        email_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        mobile: {
            type:String,
            required:true,
            maxLength:50,
        },
        mobile_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        dob: {
            type:Date,
            required:false,
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
        mobile_verified_at: {
            type:Date,
            required:false,
        },
        email_verified_at: {
            type:Date,
            required:false,
        },
        status: {
            type:String,
            enum:["inactive", "active", "rejected"],
            default:"inactive"
        },
        file:{
            Bucket:{
                type:String,
                required:false,
                maxLength:255,
            },
            Key:{
                type:String,
                required:false,
                maxLength:255,
            },
            Url:{
                type:String,
                required:false,
                maxLength:255,
            }
        },
        role:{
            type:String,
            enum:["Admin", "Vendor"],
            default:"Vendor"
        },
        city:{
            type:String,
            required:false,
            maxLength:255,
        },
        state:{
            type:String,
            required:false,
            maxLength:255,
        },
        pincode:{
            type:String,
            required:false,
            maxLength:50,
        },
        address:{
            type:String,
            required:false,
            maxLength:255,
        },
        deviceId:{
            type:String,
            required:false,
            maxLength:800,
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

module.exports = mongoose.model("User", users);