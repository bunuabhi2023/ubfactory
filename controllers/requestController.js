const Request = require('../models/request');
const VendorProduct =require('../models/vendorProduct');
const axios = require('axios');
const User =require('../models/user');
const Product = require('../models/product');
const Size = require('../models/size');

const request = async(req, res) =>{
    const {productId, sizeId, quantity} = req.body;
    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;

    const request = new Request({
        productId,
        sizeId,
        requiredQuantity: quantity,
        userId
    })

    const savedRequest = await request.save();
    const user = await User.findOne({role:'Admin'});
    const product = await Product.findById(productId);
    const size = await Size.findById(sizeId);
    const vendorUser =await User.findById(userId);
    const token = user.deviceId;
    const mobile = user.mobile;
    const productName = product.name;
    const sizeName = size.size;
    const vendorName = vendorUser.name;
    const title = `New Request: ${productName} (${quantity} items)`;
    const body = `A new request has been made for ${productName} of size ${sizeName} by ${vendorName}.`;

    const requestData = {
        token: token,
        title: title,
        body: body,
        mobile: mobile,
    };

    try {
        // Make a POST request to the external API
        const response = await axios.post('http://127.0.0.1:3000/send-notification', requestData);

        console.log('External API response:', response.data);

        return res.status(200).json({ message: 'Request Sent Successfully' });
    } catch (error) {
        console.error('Error sending notification:', error.message);
        return res.status(500).json({ error: 'An error occurred' });
    }
}

const getAllRequestByAdmin =async(req, res) =>{
    const allRequest = await Request.find()
    .populate('productId', 'name')
    .populate('sizeId', 'size')
    .populate('userId')
    .exec();
    return res.status(200).json({allRequest});
}

const getMyRequest = async(req, res) =>{
    
    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;

    const myRequest = await Request.find({userId: userId})
    .populate('productId', 'name')
    .populate('sizeId', 'size')
    .exec();
    return res.status(200).json({myRequest});
}

const updateStatus =  async(req, res) =>{
    const {requestId, status} = req.body;
    const updatedStatus = await Request.findOneAndUpdate(
        {_id:requestId},
        {status : status},
        {new:true}
        );
    if(status == "completed"){
        const productId = updatedStatus.productId;
        const sizeId = updatedStatus.sizeId;
        const userId = updatedStatus.userId;
        const quantity = updatedStatus.requiredQuantity;

        let vendorProduct = await VendorProduct.findOne({
            productId,
            sizeId,
            vendorId:userId,
        });

        if (!vendorProduct) {
            // If no record found, create a new one
            vendorProduct = new VendorProduct({
              productId,
              sizeId,
              vendorId:userId,
              totalStock: quantity,
            });
          } else {
            // If a record exists, increase totalStock
            vendorProduct.totalStock += quantity;
          }
      
          // Update the VendorProduct record
          await vendorProduct.save();
    }

    return res.status(200).json({message:"Status Changed"})
}
module.exports = {
    request,
    getAllRequestByAdmin,
    getMyRequest,
    updateStatus,
}