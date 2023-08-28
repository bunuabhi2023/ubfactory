const Request = require('../models/request');
const VendorProduct =require('../models/vendorProduct');

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
 return res.status(200).json({message:"Request Sent Successfully"})
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