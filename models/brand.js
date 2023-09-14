const mongoose = require("mongoose");

const brands = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
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

module.exports = mongoose.model("Brand", brands);