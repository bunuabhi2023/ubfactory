const mongoose = require("mongoose");


const promocodes = new mongoose.Schema(
    {
        code:{
            type:String,
            required:true,
            maxLength:255,
        },
        description:[
            {
            d1:{ 
                    type:String,
                    required:true,
                    maxLength:255,
            }, 
            instruction:{
                    type:String,
                    required:true,
                    maxLength:255,
            }, 
            d2:{
                    type:String,
                    required:true,
                    maxLength:255,
            }
            }
        ],
        discoutAmount:{ 
            type:Number,
            required:false,
        },
        discoutPerCentage:{ 
            type:String,
            required:false,
            maxLength:255,
        },
        termCondition:[{
            type:String,
            required:true,
            maxLength:255,
        }],
        isApplicable: {
            type: Boolean,
            default: true,
        },
        validityFrom: {
            type:Date,
            required:true,
        },
        validityUpTo: {
            type:Date,
            required:true,
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

module.exports = mongoose.model("PromoCode", promocodes);