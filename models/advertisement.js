const mongoose = require("mongoose");

const advertisements = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            maxLength:255,
        },
        file: {
            type:String,
            required:false,
            maxLength:255,
        },
        status: {
            type:String,
            enum:["Publish", "Draft", "Pending"],
            default: "Draft"
        },
        
        isOpenOnLoad: {
            type:Boolean,
            default: false
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

module.exports = mongoose.model("Advertisement", advertisements);