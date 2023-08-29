const User = require('../models/user');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Request = require('../models/request');

const dashboardData =  async(req, res) =>{
    try {
        const vendorCount = await User.countDocuments({ role: 'Vendor' });
        const customer =await Customer.countDocuments();
        const newRequest = await Request.countDocuments({status:'pending'});
        const pendingOrder = await Order.countDocuments({status: 'pending'});
        const acceptedOrder = await Order.countDocuments({status: 'accepted'});
        const shippedOrder = await Order.countDocuments({status: 'shipped'});
        const deliveredOrder = await Order.countDocuments({status: 'delivered'});
        const canceledOrder = await Order.countDocuments({status: 'canceled'});
        res.json({ 
            totalVendor: vendorCount,
            totalRegisteredCustomer: customer,
            totalNewRequest: newRequest,
            totalPendingOrder: pendingOrder,
            totalAcceptedOrder: acceptedOrder,
            totalShippedOrder: shippedOrder,
            totalDeliverdOrder: deliveredOrder,
            totalCanceledOrder: canceledOrder,
         });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
}

const getOrdersByTimeRange = async (req, res) => {
    try {
        const { rangeType, month, year } = req.query;
        let query = { status: 'completed' };
        
        if (rangeType === 'week') {
            query = {
                ...query,
                createdAt: {
                    $gte: moment().startOf('isoWeek'),
                    $lt: moment().endOf('isoWeek'),
                }
            };
        } else if (rangeType === 'month' && month && year) {
            const startOfMonth = moment().year(year).month(month - 1).startOf('month');
            const endOfMonth = moment().year(year).month(month - 1).endOf('month');
            query = {
                ...query,
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth,
                }
            };
        } else if (rangeType === 'year' && year) {
            const startOfYear = moment().year(year).startOf('year');
            const endOfYear = moment().year(year).endOf('year');
            query = {
                ...query,
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                }
            };
        } else {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const orderCount = await Order.countDocuments(query);
        
        res.json({ orderCount });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
};

module.exports = {
    dashboardData,
    getOrdersByTimeRange
}