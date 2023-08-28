const Order = require('../models/order');
const VendorProduct = require('../models/vendorProduct');
const crypto = require("crypto");

const sale = async(req, res) =>{
    const orderNo = crypto.randomBytes(8).toString("hex");
    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;
    const userRole = authenticatedUser.role;
    const {customerName, customerMobile, products} = req.body;

    const itemDetails = products.map(cartItem => ({
        productId: cartItem.productId,
        sizeId: cartItem.sizeId,
        quantity: cartItem.quantity,
        price: cartItem.price,
    }));

    const cartPrice = products.reduce((total, item) => {
        return total + parseFloat(item.price);
    }, 0);

    const gst = 10;
    const totalPrice =cartPrice + gst;
    const order = new Order({
        orderNo,
        customerName,
        customerMobile,
        userId : userId,
        itemDetails,
        cartPrice,
        totalPrice,
        isPaid: true,
        status: "sold",
        deliveryDate: Date.now(),
    });

    const savedOrder = await order.save();
    if(savedOrder){

        // Update totalStock of selectedUser's vendor products
        if(userRole == "Vendor"){

            for (const cartItem of products) {
                const productId = cartItem.productId;
                const sizeId = cartItem.sizeId;
                const quantity = cartItem.quantity;

                const vendorProduct = await VendorProduct.findOne({
                vendorId: userId,
                productId: productId,
                sizeId: sizeId,
                });

                if (vendorProduct) {
                vendorProduct.totalStock = Math.max(0, vendorProduct.totalStock - quantity);
                await vendorProduct.save();
                }
            }
        }
    }
    console.log(savedOrder);
    return res.status(200).json({data: savedOrder, message: 'Order Created Successfully' });
}

module.exports = {
    sale,
}
