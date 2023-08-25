const mongoose = require("mongoose");


const plans = new mongoose.Schema(
    {
        description:[{
            type:String,
            required:true,
            maxLength:255,
        }],
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        price: {
            type:mongoose.Types.Decimal128,
            required:true,
            maxLength:255,
        },
        promoPrice: {
            type:mongoose.Types.Decimal128,
            required:false,
            maxLength:255,
        },
        validity: {
            type:String,
            required:false,
            maxLength:255,
        },
    }
);

module.exports = mongoose.model("Plan", plans);