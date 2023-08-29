const Order = require('../models/order');
const Cart = require('../models/cart'); 
const CustomerAddress = require('../models/customerAddress');
const User = require('../models/user'); 
const VendorProduct = require('../models/vendorProduct');
const Product = require('../models/product');
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const pdfkit = require("pdfkit");
const fs = require('fs');
const path = require('path');

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

    const users = await User.find({status: "active"}); //need to filter inactive filter

    const usersWithDistances = users.map(user => {
        const distance = calculateDistance(customerLatitude, customerLongitude, user.latitude, user.longitude);
        return { user, distance };
    });

    usersWithDistances.sort((a, b) => a.distance - b.distance);

    // Find the nearest user with available stock
    let selectedUser = null;

    for (const userWithDistance of usersWithDistances) {
        //need to check for Admin//
        const user = userWithDistance.user;
        const vendorId = user._id;
        userRole = user.role;

        if(userRole == "Admin"){
            selectedUser = user;
            break;
        }

        const hasStock = await Promise.all(cartDetails.map(async cartItem => {
            const productId = cartItem.productId;
            const sizeId = cartItem.sizeId;
            const quantity = cartItem.quantity;

            const vendorProduct = await VendorProduct.findOne({
                vendorId: vendorId,
                productId: productId,
                sizeId: sizeId,
            });
            
            const stock = vendorProduct ? vendorProduct.totalStock : 0; 
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
    sendInvoiceEmail(authenticatedUser.email, savedOrder);

    const pdfContent = generatePDFContent(savedOrder); // Generate PDF content
    const pdfBuffer = await generatePDFBuffer(pdfContent);
    const pdfFileName = `invoice_${savedOrder.orderNo}.pdf`;
    const pdfFilePath = path.join(__dirname, '../uploads', pdfFileName);

    fs.writeFileSync(pdfFilePath, pdfBuffer);

    // Update the order with the PDF filename
    savedOrder.invoice = pdfFileName;
    await savedOrder.save();
    if(savedOrder){
        const updatedCart = await Cart.findOneAndUpdate(
            {
                customerId: customerId,
                isOrdered: false,
            },
            {isOrdered: true},
            { new: true }
          );

        // Update totalStock of selectedUser's vendor products
        if(selectedUser.role == "Vendor"){
            const selectedUserId = selectedUser._id;

            for (const cartItem of cartDetails) {
                const productId = cartItem.productId;
                const sizeId = cartItem.sizeId;
                const quantity = cartItem.quantity;

                const vendorProduct = await VendorProduct.findOne({
                vendorId: selectedUserId,
                productId: productId,
                sizeId: sizeId,
                });

                if (vendorProduct) {
                vendorProduct.totalStock = Math.max(0, vendorProduct.totalStock - quantity);
                await vendorProduct.save();
                }

                const product = await Product.findOne({_id:productId});
                if(product){
                    product.saleCount = Math.max(0, product.saleCount + 1);
                    await product.save();
                }
            }
        }
        
    }
    console.log(savedOrder);
    return res.status(200).json({data: savedOrder, message: 'Order Created Successfully' });
 }catch(error){
    console.log(error);
 }
};



// Function to send the invoice email
const sendInvoiceEmail = async (recipientEmail, order) => {
    const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
      auth: {
        user: "webienttechenv@gmail.com",
        pass: "ljxugdpijagtxeda",
      },
    });
  
    const pdfContent = generatePDFContent(order); // Generate PDF content
    const pdfBuffer = await generatePDFBuffer(pdfContent); // Generate PDF buffer

    const mailOptions = {
    from: "your-email@gmail.com", // Use your Gmail address
    to: recipientEmail,
    subject: "Invoice for Your Order",
    text: "Please see the attached invoice for your order.",
    attachments: [
        {
        filename: "invoice.pdf",
        content: pdfBuffer,
        },
    ],
    
};
  
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
    console.log("Error sending email:", error);
    } else {
    console.log("Email sent:", info.response);
    }
});
};

const generatePDFContent = (order) => {
    const doc = new pdfkit();
    doc.text(`Invoice for Order #${order.orderNo}`);
    doc.text(`Total Price: ${order.totalPrice}`);
    // Add more details to the PDF content
    return doc;
};
  
  // Convert PDF content to a buffer
const generatePDFBuffer = async (pdfContent) => {
return new Promise((resolve, reject) => {
    const buffers = [];
    pdfContent.on("data", (chunk) => buffers.push(chunk));
    pdfContent.on("end", () => resolve(Buffer.concat(buffers)));
    pdfContent.on("error", (error) => reject(error));
    pdfContent.end();
});
};

const getMyOrder = async(req, res) =>{
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    try {
        const myOrder = await Order.find({customerId : customerId})
        .populate('itemDetails.productId')
        .populate('itemDetails.sizeId')
        .populate('userId', 'name')
        .populate('customerAddressId')
        .populate('customerId', 'name')
        .exec();

        const ordersWithImageUrls = myOrder.map(order => {
            const itemDetailsWithImageUrls = order.itemDetails.map(item => {
                const product = item.productId;
                const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
                const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

                return {
                    ...item.toObject(),
                    fileUrl: fileUrl,          // Add the main image URL to the item
                    extraFilesUrls: extraFilesUrls // Add the extra images URLs to the item
                };
            });
            const invoiceFileUrl = order.invoice ? `${req.protocol}://${req.get('host')}/uploads/${order.invoice}` : null;
            return {
                ...order.toObject(),
                itemDetails: itemDetailsWithImageUrls,
                invoiceUrl:invoiceFileUrl
            };
        });

        return res.status(200).json(ordersWithImageUrls);
    } catch (error) {
        console.log(error);
    }
};

const getVendorOrder = async(req, res) =>{
    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;
    try {
        const myOrder = await Order.find({userId : userId})
        .populate('itemDetails.productId')
        .populate('itemDetails.sizeId')
        .populate('userId', 'name')
        .populate('customerAddressId')
        .populate('customerId', 'name')
        .exec();

        const ordersWithImageUrls = myOrder.map(order => {
            const itemDetailsWithImageUrls = order.itemDetails.map(item => {
                const product = item.productId;
                const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
                const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

                return {
                    ...item.toObject(),
                    fileUrl: fileUrl,          // Add the main image URL to the item
                    extraFilesUrls: extraFilesUrls // Add the extra images URLs to the item
                };
            });
            const invoiceFileUrl = order.invoice ? `${req.protocol}://${req.get('host')}/uploads/${order.invoice}` : null;
            return {
                ...order.toObject(),
                itemDetails: itemDetailsWithImageUrls,
                invoiceUrl:invoiceFileUrl
            };
        });

        return res.status(200).json(ordersWithImageUrls);
    } catch (error) {
        console.log(error);
    }
}

const getAllOrderForAdmin = async(req, res) =>{
    try {
        const myOrder = await Order.find()
        .populate('itemDetails.productId')
        .populate('itemDetails.sizeId')
        .populate('userId', 'name')
        .populate('customerAddressId')
        .populate('customerId', 'name')
        .exec();

        const ordersWithImageUrls = myOrder.map(order => {
            const itemDetailsWithImageUrls = order.itemDetails.map(item => {
                const product = item.productId;
                const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
                const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

                return {
                    ...item.toObject(),
                    fileUrl: fileUrl,          // Add the main image URL to the item
                    extraFilesUrls: extraFilesUrls // Add the extra images URLs to the item
                };
            });
            const invoiceFileUrl = order.invoice ? `${req.protocol}://${req.get('host')}/uploads/${order.invoice}` : null;
            return {
                ...order.toObject(),
                itemDetails: itemDetailsWithImageUrls,
                invoiceUrl:invoiceFileUrl
            };
        });

        return res.status(200).json(ordersWithImageUrls);
    } catch (error) {
        console.log(error);
    }
}

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

const updateOrderStatus = async(req, res) =>{
    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;
    const userRole = authenticatedUser.role;
    const {_id , status} = req.body;
    
    let orderData;
    if(userRole == "Vendor"){
        const order = await Order.findOneAndUpdate(
            {userId : userId, _id: _id},
            
            {status: status},
            { new: true }
        );
     orderData = order;
    }
    if(userRole == "Admin"){
        const order = await Order.findOneAndUpdate(
            { _id: _id},
            
            {status: status},
            { new: true }
        );
        orderData = order;
    }

        

    if(!orderData){
        return res.status(404).json("No record Found"); 
    }

    return res.status(200).json({orderData, messgae:"Order Status Chnaged"});
}

module.exports = {
    createOrder,
    getMyOrder,
    getVendorOrder,
    getAllOrderForAdmin,
    updateOrderStatus,
}
