const User = require('../models/user');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Request = require('../models/request');

const vendorDashboardData =  async(req, res) =>{

    const authenticatedUser = req.user;
    const userId = authenticatedUser._id;
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const totalSaleInMonth = await Order.find({
            userId: userId,
            status: { $in: ['delivered', 'completed', 'sold'] },
            createdAt: { $gte: thirtyDaysAgo },
        });

        const totalRevenue = totalSaleInMonth.reduce(
            (total, order) => total + parseFloat(order.totalPrice), // Use parseFloat to convert string to number
            0
        );

        const newOrder = await Order.countDocuments({userId: userId, status: 'pending'});
        const acceptedOrder = await Order.countDocuments({userId: userId, status: 'accepted'});
        const shippedOrder = await Order.countDocuments({userId: userId, status: 'shipped'});
        const deliveredOrder = await Order.countDocuments({userId: userId, status: 'delivered'});
        const canceledOrder = await Order.countDocuments({userId: userId, status: 'canceled'});
        res.json({ 
            totalSaleIn30Days: totalRevenue,
            totalnewOrder: newOrder,
            totalAcceptedOrder: acceptedOrder,
            totalShippedOrder: shippedOrder,
            totalDeliverdOrder: deliveredOrder,
            totalCanceledOrder: canceledOrder,
         });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}

module.exports = {
    vendorDashboardData
}