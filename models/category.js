const mongoose = require("mongoose");

const categories = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        file: {
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
        },
        createdBy:{
            type:String,
            required:false,
        },
        updatedBy:{
            type:String,
            required:false,
        },


    }
);

module.exports = mongoose.model("Category", categories);