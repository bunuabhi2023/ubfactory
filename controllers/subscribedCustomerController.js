const SubscribedCustomer = require('../models/subscribedCustomer');
const Transaction = require('../models/transaction');
const Plan = require('../models/plan');
const crypto = require("crypto");
const Razorpay = require("razorpay");

function hmac_sha256(data, key) {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(data);
    return hmac.digest("hex");
}

const addSubscription = async(req,res) =>{
   const plan = await Plan.findById(req.body.planId);
   const validity = parseInt(plan.validity);
   const price = plan.price;
   const orderNo = crypto.randomBytes(8).toString("hex");
   const {planId, startDate } = req.body;
   const authenticatedUser = req.customer;
   const customerId = authenticatedUser._id;

   try {
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setDate(calculatedEndDate.getDate() + validity);
        const subscription = new SubscribedCustomer({
            orderNo,
            customerId,
            planId,
            price,
            startDate,
            endDate: calculatedEndDate,
            isPaid: false
        });

        const savedSubscription = await subscription.save();
        console.log(savedSubscription);
        return res.status(200).json({data: savedSubscription, message: 'You have add the subscription Plan , Now Please Complete the Payment' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create Product' });
    }


};

const payNow = async(req, res) =>{

    try {
        const razorpayKey = "rzp_live_RFDCf6fNpIDBTl";
        const razorpaySecret = "EGt4ymeXKGxJ1hTnDr8j0b2j";

        const razorpay = new Razorpay({
            key_id: razorpayKey,
            key_secret: razorpaySecret,
        });

        const orderNo = req.body.orderNo;

        const authenticatedUser = req.customer;
        const customerId = authenticatedUser._id;
        // Create an order on Razorpay
        const customerData = {
            name: authenticatedUser.name,
            email: authenticatedUser.email,
            mobile: authenticatedUser.mobile
        };
        const subscribedData = await SubscribedCustomer.findOne({
            orderNo: orderNo,
            customerId: customerId,
        });

        const amount = subscribedData.price;
        const planId = subscribedData.planId;
        const orderData = {
            receipt: orderNo,
            amount: amount * 100, // Example: Amount in paise
            currency: "INR",
        };

        const orderRzp = await razorpay.orders.create(orderData);

        const transaction = new Transaction({
            orderNo:orderRzp.receipt,
            customerId,
            planId,
            amount:orderRzp.amount,
            razorpayOrderId: orderRzp.id,
            razorpayPaymentId: null,
            razorpaySignature: null
        });

        const savedtransction = await transaction.save();
        const responsePayload = {
            status: "Success",
            transaction: savedtransction,
            customer: customerData,
        };

        res.status(200).json(responsePayload);
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }

};

const successPayment = async(req, res) =>{
    try{
        const secret = 'EGt4ymeXKGxJ1hTnDr8j0b2j';

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const expectedSignature = hmac_sha256(
            `${razorpayOrderId}|${razorpayPaymentId}`,
            secret
        );

        if (expectedSignature === razorpaySignature) {

            const updateTransaction = await Transaction.findOneAndUpdate(
                {razorpayOrderId: razorpayOrderId},
              { razorpayPaymentId, razorpaySignature, updatedAt: Date.now() },
              { new: true }
            );

            const updateSubscription = await SubscribedCustomer.findOneAndUpdate(
                {orderNo:updateTransaction.orderNo},
              { isPaid:true, updatedAt: Date.now() },
              { new: true }
            );

            

            const responseData = {
                status: "Success",
                message: "Payment success",
            };

            res.status(201).json(responseData);
        } else {
            // Invalid signature
            const responseData = {
                status: "Error",
                message: "Payment failed",
            };

            res.status(201).json(responseData);
        }
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }

}

const getMySubscription = async(req, res) =>{
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    const currentDate = new Date();
    try {
        const subscription = await SubscribedCustomer.find({
            customerId: customerId,
            endDate: { $gt: currentDate },
            isPaid:true,
        }).populate('planId').exec();
    
        if(!subscription){
            res.status(409).json({  message: "No Plan Found" });
        }
    
        res.status(200).json({ status: "Success",  subscription});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error", message: error.message }); 
    }
}

const getSubscribedCustomers = async(req, res) =>{
    const currentDate = new Date();
    try {
        const subscription = await SubscribedCustomer.find({
            endDate: { $gt: currentDate },
            isPaid:true,
        }).populate('planId').populate('customerId').exec();
    
        if(!subscription){
            res.status(409).json({  message: "No Plan Found" });
        }
    
        res.status(200).json({ status: "Success",  subscription});
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: "Error", message: error.message }); 
    }
}

module.exports = {
    addSubscription,
    payNow,
    successPayment,
    getMySubscription,
    getSubscribedCustomers,
}

