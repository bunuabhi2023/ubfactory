const mongoose = require("mongoose");

const orders = new mongoose.Schema(
    {
        orderNo:{
            type:String,
            required:true,
            maxLength:255,
        },
        customerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required:false,
        },
        customerName:{
            type: String,
            required: false,
            maxLength: 255,
        },
        customerMobile:{
            type: String,
            required: false,
            maxLength: 255,
        },
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        },
        itemDetails: [{  
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            sizeId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Size',
                required: true,
            },
            quantity:{
                type: Number,
                required: true,
            },
            price:{
                type: String,
                required: true,
                maxLength: 255,
            },
        }],
        customerAddressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomerAddress',
            required: false,
        },
        cartPrice:{
            type: String,
            required: false,
            maxLength: 255,
        },
        gst:{
            type: String,
            required: false,
            maxLength: 255,
        },
        // appliedPromo:{
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'Promo',
        //     required: false,
        // },
        
        deliveryCharge:{
            type: String,
            required: false,
            maxLength: 255,
        },
        discount:{
            type: String,
            required: false,
            maxLength: 255,
        },
        totalPrice:{
            type: String,
            required: false,
            maxLength: 255,
        },
        paymentType:{
            type: String,
            enum:["rzp", "cod"],
        },
        status:{
            type: String,
            enum:["pending", "accepted", "packed", "shipped", "delivered", "completed", "sold",  "canceled"],
            default: "pending"
        },
        isPaid: {
            type:Boolean,
            default:false,
        },
        deliveryDate: {
            type:Date,
            required:false,
        },
        distance:{
            type: String,
            required: false,
            maxLength: 255,
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

module.exports = mongoose.model("Order", orders);