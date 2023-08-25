const Order = require('../models/order');
const Cart = require('../models/cart'); 
const CustomerAddress = require('../models/customerAddress');
const User = require('../models/user'); 
const VendorProduct = require('../models/vendorProduct');
const crypto = require("crypto");
const Razorpay = require("razorpay");

const createOrder = async(req, res) =>{
  try{   
    const orderNo = crypto.randomBytes(8).toString("hex");
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    const cart = await Cart.findOne({
        customerId: customerId,
        isOrdered: false,
    });

    const cartDetails = cart.cartDetails;
    const cartPrice = cart.cartDetails.reduce((total, item) => {
        return total + parseFloat(item.price);
    }, 0);

    const {customerAddressId, paymentType}= req.body;

    const customerAddress = await CustomerAddress.findById(customerAddressId);
    const customerLatitude = customerAddress.latitude;
    const customerLongitude = customerAddress.longitude;

    const users = await User.find();

    const usersWithDistances = users.map(user => {
        const distance = calculateDistance(customerLatitude, customerLongitude, user.latitude, user.longitude);
        return { user, distance };
    });

    usersWithDistances.sort((a, b) => a.distance - b.distance);

    // Find the nearest user with available stock
    let selectedUser = null;

    for (const userWithDistance of usersWithDistances) {
        const user = userWithDistance.user;
        const vendorId = user._id;

        const hasStock = await Promise.all(cartDetails.map(async cartItem => {
            const productId = cartItem.productId;
            const sizeId = cartItem.sizeId;
            const quantity = cartItem.quantity;

            const vendorProduct = await VendorProduct.findOne({
                vendorId: vendorId,
                productId: productId,
                sizeId: sizeId,
            });

            const stock = vendorProduct.totalStock;
            return stock >= quantity;
        }));

        if (hasStock.every(item => item === true)) {
            selectedUser = user;
            break;
        }
    }

    // If no suitable vendor with enough stock is found, find an admin user
    if (!selectedUser) {
        selectedUser = users.find(user => user.role === 'Admin');
    }

    console.log(selectedUser);

    const selectedUserWithDistance = usersWithDistances.find(entry => entry.user === selectedUser);

    const dist = selectedUserWithDistance.distance;
    let deliveryCharge = 40;

    if(dist <= 1){
         deliveryCharge = 0;
    };
    if(dist > 1 && dist <= 5 ){
         deliveryCharge = 20;
    };
    
    if(dist > 5 && dist <= 10 ){
        deliveryCharge = 30;
    };
    if(dist > 10){
        deliveryCharge = 40;
    };

    const totalPrice =  cartPrice + deliveryCharge;
    console.log(selectedUser._id);
    const itemDetails = cartDetails.map(cartItem => ({
        productId: cartItem.productId,
        sizeId: cartItem.sizeId,
        quantity: cartItem.quantity,
        price: cartItem.price,
    }));

    const order = new Order({
        orderNo,
        customerId,
        userId : selectedUser._id,
        itemDetails,
        customerAddressId,
        cartPrice,
        gst: " ",
        deliveryCharge,
        discount: "", 
        totalPrice,
        paymentType,
        isPaid: false,
        deliveryDate: null,
        distance: dist.toString(),
    });

    const savedOrder = await order.save();
    if(savedOrder){
        const updatedCart = await Cart.findOneAndUpdate(
            {
                customerId: customerId,
                isOrdered: false,
            },
            {isOrdered: true},
            { new: true }
          );
    }
    
    console.log(savedOrder);
    return res.status(200).json({data: savedOrder, message: 'Order Created Successfully' });
 }catch(error){
    console.log(error);
 }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371; // Radius of the Earth in kilometers

    // Convert latitude and longitude from degrees to radians
    const latRad1 = degToRad(lat1);
    const lonRad1 = degToRad(lon1);
    const latRad2 = degToRad(lat2);
    const lonRad2 = degToRad(lon2);

    // Calculate differences in latitude and longitude
    const latDiff = latRad2 - latRad1;
    const lonDiff = lonRad2 - lonRad1;

    // Calculate the Haversine formula
    const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
              Math.cos(latRad1) * Math.cos(latRad2) *
              Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance
    const distance = earthRadius * c;

    return distance; // Distance in kilometers
};

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
};


module.exports = {
    createOrder,
}
