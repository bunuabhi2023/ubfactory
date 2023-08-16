const Discount = require('../models/discount');
const Category =require('../models/category');


const createDiscount = async (req, res) => {
  
    const { title, startFrom, endTo, discountAmount, discountPercentage, minimumOrderValue, dailyTimeSlot, customerType, productId, 
      categoryIds, } = req.body;
    const createdBy = req.user.id;


    const newDiscount = new Discount({
        title,
        discountAmount,
        discountPercentage,
        startFrom,
        endTo,
        minimumOrderValue,
        dailyTimeSlot,
        customerType,
        productId,
        createdBy,
        categoryIds,
      });

    try {
      const savedDiscount = await newDiscount.save();
      console.log(savedDiscount); // Add this line for debug logging
      res.status(200).json({ message: 'Discount created Successfuly' });
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to create Discount' });
    }
 
};

const updateDiscount = async (req, res) => {
    
  
  const { title, startFrom, endTo, discountAmount, discountPercentage, minimumOrderValue, dailyTimeSlot, customerType, productId,
    categoryIds, } = req.body;
  const updatedBy = req.user.id;


  try {
    const updatedDiscount = await Discount.findByIdAndUpdate(
      req.params.id,
      { title, startFrom, endTo, discountAmount, discountPercentage, minimumOrderValue, dailyTimeSlot, customerType, productId,
        categoryIds, updatedBy, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedDiscount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Discount not found' });
    }

    console.log(updatedDiscount); // Add this line for debug logging
    res.json(updatedDiscount);
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: 'Failed to update Discount' });
  }
};

// Function to get all discount
const getAllDiscount = async (req, res)  => {
  try {
    const discounts = await Discount.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('productId', 'name')
      .exec();

    const populatedDiscounts = await Promise.all(discounts.map(async discount => {
      const populatedCategories = await Category.find({
        _id: { $in: discount.categoryIds }
      }, 'name');

      const categoryObjects = populatedCategories.map(category => ({
        _id: category._id,
        name: category.name
      }));

      return {
        ...discount.toObject(),
        categoryIds: categoryObjects,
      };
    }));

    res.json(populatedDiscounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
};



// Function to get a discount by ID
const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('productId', 'name')
      .exec();

    if (!discount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Discount not found' });
    }

    const populatedCategories = await Category.find({
      _id: { $in: discount.categoryIds }
    }, 'name');

    const categoryObjects = populatedCategories.map(category => ({
      _id: category._id,
      name: category.name
    }));

    const populatedDiscount = {
      ...discount.toObject(),
      categoryIds: categoryObjects,
    };

    res.json(populatedDiscount);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discount' });
  }
};


// Function to delete a discount by ID
const deleteDiscount = async (req, res) => {
  try {
    const deletedDiscount = await Discount.findByIdAndDelete(req.params.id);
    if (!deletedDiscount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json({ message: 'DIscount deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete Discount' });
  }
};

module.exports = {
    createDiscount,
    updateDiscount,
    getAllDiscount,
    getDiscountById,
    deleteDiscount
  };