const User = require('../models/user');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Request = require('../models/request');
const SubscribedCustomer = require('../models/subscribedCustomer');
const order = require('../models/order');

const dashboardData = async (req, res) => {
    try {
        const dateParam = req.query.date;

        // Define the default date filter
        const defaultDateFilter = {};

        // If a date parameter is provided, use it to create a date filter
        if (dateParam) {
            const selectedDate = new Date(dateParam);
            const startDate = new Date(selectedDate);
            startDate.setDate(selectedDate.getDate() - 30);

            const dateFilter = {
                createdAt: {
                    $gte: startDate, // Filter documents created on or after 30 days before the selected date
                    $lte: new Date(dateParam + 'T23:59:59.999Z'), // Filter documents created before the end of the selected date
                },
            };

            // Use the date filter for all counts
            defaultDateFilter.createdAt = dateFilter.createdAt;
        } else {
            // If no date parameter is provided, calculate the date range for the last 30 days from the current date
            const currentDate = new Date();
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 30);

            defaultDateFilter.createdAt = {
                $gte: startDate, // Filter documents created on or after 30 days before the current date
                $lte: currentDate, // Filter documents created before the current date
            };
        }

        const customer = await Customer.countDocuments(defaultDateFilter);
        const deliveredOrder = await Order.countDocuments({ status: { $in: ['delivered', 'sold'] }, ...defaultDateFilter });
        const canceledOrder = await Order.countDocuments({ status: 'canceled', ...defaultDateFilter });

        // Calculate total revenue for the last 30 days
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    $and: [
                        defaultDateFilter,
                        { status: { $in: ['delivered', 'sold'] } },
                    ],
                },
            },
            {
                $addFields: {
                    totalPriceNumeric: { $toDouble: '$totalPrice' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPriceNumeric' }, // Use the converted numeric field
                },
            },
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        const totalSubscribedCustomers = await SubscribedCustomer.aggregate([
            {
                $match: {
                    endDate: { $gte: new Date() }, // Filter documents with endDate greater than or equal to the current date
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }, // Count the documents that match the criteria
                },
            },
        ]);
        
        const subscribedCustomerCount = totalSubscribedCustomers.length > 0 ? totalSubscribedCustomers[0].count : 0;
        
        // Calculate user growth percentage for the current month
        const userGrowthPercentage = await calculateUserGrowthPercentage();

        // Calculate revenue growth percentage for the current month
        const revenueGrowthPercentage = await calculateRevenueGrowthPercentage();
        res.json({
            totalRegisteredCustomer: customer,
            totalSubscription: subscribedCustomerCount,
            totalDeliveredOrder: deliveredOrder,
            totalCanceledOrder: canceledOrder,
            totalRevenue: revenue,
            revwnueGrowthInAMonth: revenueGrowthPercentage,
            userGrowthInAMonth: userGrowthPercentage,
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
};

const calculateUserGrowthPercentage = async () => {
    try {
        // Calculate the total registered customers for the current month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const currentMonthCustomerCount = await Customer.countDocuments({
            createdAt: { $gte: firstDayOfMonth, $lte: currentDate },
        });

        // Calculate the total registered customers for the previous month
        const previousMonthEndDate = new Date(firstDayOfMonth);
        previousMonthEndDate.setDate(firstDayOfMonth.getDate() - 1);

        const previousMonthStartDate = new Date(previousMonthEndDate.getFullYear(), previousMonthEndDate.getMonth(), 1);

        const previousMonthCustomerCount = await Customer.countDocuments({
            createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate },
        });

        // Calculate the user growth percentage
        let userGrowthPercentage = 0;

        if (previousMonthCustomerCount > 0) {
            userGrowthPercentage = ((currentMonthCustomerCount - previousMonthCustomerCount) / previousMonthCustomerCount) * 100;
            userGrowthPercentage = Math.max(userGrowthPercentage, 0);  // Ensure non-negative value
        }

        return userGrowthPercentage;
    } catch (error) {
        throw new Error('Error calculating user growth percentage');
    }
};

const calculateRevenueGrowthPercentage = async () => {
    try {
        // Calculate the total revenue for the current month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        const currentMonthTotalRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: firstDayOfMonth, $lte: currentDate },
                    status: { $in: ['delivered', 'sold'] },
                },
            },
            {
                $addFields: {
                    totalPriceNumeric: { $toDouble: '$totalPrice' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPriceNumeric' },
                },
            },
        ]);

        const currentMonthRevenue = currentMonthTotalRevenue.length > 0 ? currentMonthTotalRevenue[0].total : 0;

        // Calculate the total revenue for the previous month
        const previousMonthEndDate = new Date(firstDayOfMonth);
        previousMonthEndDate.setDate(firstDayOfMonth.getDate() - 1);

        const previousMonthStartDate = new Date(previousMonthEndDate.getFullYear(), previousMonthEndDate.getMonth(), 1);

        const previousMonthTotalRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate },
                    status: { $in: ['delivered', 'sold'] },
                },
            },
            {
                $addFields: {
                    totalPriceNumeric: { $toDouble: '$totalPrice' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPriceNumeric' },
                },
            },
        ]);

        const previousMonthRevenue = previousMonthTotalRevenue.length > 0 ? previousMonthTotalRevenue[0].total : 0;

        // Calculate the revenue growth percentage
        let revenueGrowthPercentage;
        if (previousMonthRevenue === 0) {
            revenueGrowthPercentage = currentMonthRevenue > 0 ? 100 : 0;
        } else {
            revenueGrowthPercentage = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
            revenueGrowthPercentage = Math.max(revenueGrowthPercentage, 0); // Ensure non-negative value
        }

        return revenueGrowthPercentage;
    } catch (error) {
        throw new Error('Error calculating revenue growth percentage');
    }
};


// Function to get the week name from a date
function getWeekName(date) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = date.getDay();
    return weekdays[dayIndex];
}
const getCurrentWeekOrderCount = async () => {
    try {
        // Calculate the start and end dates for the current week starting from Monday
        const today = new Date();
        const currentDayIndex = today.getDay();
        const daysUntilMonday = (currentDayIndex === 0 ? 6 : currentDayIndex - 1); // Calculate days to subtract for Monday
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysUntilMonday); // Go back to the previous Monday
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End on Sunday of the current week

        const dailyOrderCounts = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate), // Start date (Monday)
                        $lte: new Date(endDate), // End date (Sunday)
                    },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { '_id.date': 1 }, // Sort by date in ascending order
            },
        ]);

        // Create an object to store the counts for each day of the week
        const weekCounts = {};

        // Initialize counts for each day to 0
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            weekCounts[date.toISOString().split('T')[0]] = { date: date.toISOString().split('T')[0], day: getWeekName(date), totalOrder: 0 };
        }

        // Fill in the counts from the aggregation result
        dailyOrderCounts.forEach(item => {
            const date = item._id.date;
            weekCounts[date].totalOrder = item.count;
        });

        // Convert the weekCounts object to an array of values
        const weekCountsArray = Object.values(weekCounts);

        return weekCountsArray;
    } catch (error) {
        throw error;
    }
};
const currentWeekOrderData = async (req, res) => {
    try {
        // Get the current week-wise order counts starting from Monday
        const weekCounts = await getCurrentWeekOrderCount();

        res.json({
            weeklyOrderCounts: weekCounts,
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
};
async function getOrderCountsByMonth(userId) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const previousYear = currentYear - 1;

  const matchConditions = [
    { $or: [
        { status: "delivered" },
        { status: "sold" },
      ]
    },
    { deliveryDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      }
    },
  ];

  if (userId !== null) {
    matchConditions.unshift({ userId:userId });
  }

  const pipeline = [
    {
      $match: {
        $and: matchConditions,
      },
    },
    {
      $group: {
        _id: { $month: "$deliveryDate" },
        revenue: { $sum: { $toDouble: "$totalPrice" } }, // Assuming totalPrice is a numeric field
      },
    },
  ];
  const currentYearCounts = await Order.aggregate(pipeline);

  // Similar pipeline for previous year
  const previousYearCounts = await Order.aggregate([
    {
      $match: {
        $and: matchConditions,
        createdAt: {
          $gte: new Date(`${previousYear}-01-01`),
          $lte: new Date(`${previousYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: { $toDouble: "$totalPrice" } }, // Assuming totalPrice is a numeric field
      },
    },
  ]);

 return { currentYearCounts, previousYearCounts }
}
const totalRevenue = async(req, res)=>{
    const user= req.user;
    try{

        if(user.role === 'Admin')
        {const revenue = await getOrderCountsByMonth(null);
        res.status(200).json(revenue);}
        else {
            const revenue = await getOrderCountsByMonth(user._id);
            res.status(200).json(revenue);
        }
    }
    catch(err)
    {
        res.status(500).send('something went wrong')

    }
}

module.exports = {
    dashboardData,
    currentWeekOrderData,
    totalRevenue
}





  
