const Order = require('../models/order');
const VendorProduct = require('../models/vendorProduct');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pdfkit = require("pdfkit");
const fs = require('fs');
const path = require('path');

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

    
    const pdfContent = generatePDFContent(savedOrder); // Generate PDF content
    const pdfBuffer = await generatePDFBuffer(pdfContent);
    const pdfFileName = `invoice_${savedOrder.orderNo}.pdf`;
    const pdfFilePath = path.join(__dirname, '../uploads', pdfFileName);

    fs.writeFileSync(pdfFilePath, pdfBuffer);

    // Update the order with the PDF filename
    savedOrder.invoice = pdfFileName;
    await savedOrder.save();
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

module.exports = {
    sale,
}
