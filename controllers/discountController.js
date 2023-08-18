const Discount = require('../models/discount');
const Category = require('../models/category');
const Product = require('../models/product');
const Brand = require('../models/brand');
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/'); // Set the destination folder for uploaded images
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname); // Set the filename for the uploaded image
    },
  });
  
  const fileFilter = (req, file, cb) => {
    // Check file type to allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed.'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).single('file'); // Specify that this is a single file upload


const createDiscount = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    const { title, productId,categoryId} = req.body;
    const createdBy = req.user.id;
    const file = req.file ? req.file.filename : undefined;


    let newDiscount;

    if (productId && categoryId) {
      newDiscount = new Discount({
        title,
        file,
        status: 'Draft',
        productId, // Ensure this is a valid ObjectId
        createdBy,
        categoryId, // Ensure this is a valid ObjectId
      });
    } else if (productId) {
      newDiscount = new Discount({
        title,
        file,
        status: 'Draft',
        productId, // Ensure this is a valid ObjectId
        createdBy,
      });
    } else if (categoryId) {
      newDiscount = new Discount({
        title,
        file,
        status: 'Draft',
        createdBy,
        categoryId, // Ensure this is a valid ObjectId
      });
    } else {
      newDiscount = new Discount({
        title,
        file,
        status: 'Draft',
        createdBy,
      });
    }

    try {
      const savedDiscount = await newDiscount.save();
      console.log(savedDiscount); // Add this line for debug logging
      res.status(200).json({ message: 'Discount created Successfuly' });
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to create Discount' });
    }
  });
};

const updateDiscount = async (req, res) => {
    
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    const { title, status, productId,categoryId} = req.body;
    const updatedBy = req.user.id;
    let updateFields = {
      title,
      status,
      updatedBy,
      updatedAt: Date.now(),
    };

    // Handle productId and categoryId
    if (productId) {
      updateFields.productId = productId; // Ensure this is a valid ObjectId
    }
    if (categoryId) {
      updateFields.categoryId = categoryId; // Ensure this is a valid ObjectId
    }

    try {
      const updatedDiscount = await Discount.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      );

      if (!updatedDiscount) {
        console.log(`Discount with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Discount not found' });
      }

      console.log(updatedDiscount);
      res.json(updatedDiscount);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Discount' });
    }
  });
};

// Function to get all discount
const getAllDiscount = async (req, res)  => {
  try {
    const discounts = await Discount.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('categoryId', 'name')
      .populate('productId', 'name')
      .exec();
      
      const discountWithUrls = discounts.map((discount) => {
        const imageUrl = discount.file ? `${req.protocol}://${req.get('host')}/uploads/${discount.file}` : null;
        return { ...discount._doc, imageUrl };
        });
        res.json(discountWithUrls);

    // const populatedDiscounts = await Promise.all(discounts.map(async discount => {
    //   const populatedCategories = await Category.find({
    //     _id: { $in: discount.categoryIds }
    //   }, 'name');

    //   const categoryObjects = populatedCategories.map(category => ({
    //     _id: category._id,
    //     name: category.name
    //   }));

    //   const populatedProducts = await Product.find({
    //     _id: { $in: discount.productIds }
    //   }, 'name');

    //   const productObjects = populatedProducts.map(product => ({
    //     _id: product._id,
    //     name: product.name
    //   }));

    //   const populatedBrands = await Brand.find({
    //     _id: { $in: discount.brandIds }
    //   }, 'name');

    //   const brandObjects = populatedBrands.map(brand => ({
    //     _id: brand._id,
    //     name: brand.name
    //   }));

    //   return {
    //     ...discount.toObject(),
    //     categoryIds: categoryObjects,
    //     productIds: productObjects,
    //     brandIds: brandObjects,
    //   };

      

    // }));

    // res.json(populatedDiscounts);
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
      .populate('categoryId', 'name')
      .populate('productId', 'name')
      .exec();

    if (!discount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Discount not found' });
    }
    const imageUrl = discount.file ? `${req.protocol}://${req.get('host')}/uploads/${discount.file}` : null;
    const discountWithUrls = { ...discount._doc, imageUrl };

    res.json(discountWithUrls);
    // const populatedCategories = await Category.find({
    //   _id: { $in: discount.categoryIds }
    // }, 'name');

    // const categoryObjects = populatedCategories.map(category => ({
    //   _id: category._id,
    //   name: category.name
    // }));

    // const populatedProducts = await Product.find({
    //   _id: { $in: discount.productIds }
    // }, 'name');

    // const productObjects = populatedProducts.map(product => ({
    //   _id: product._id,
    //   name: product.name
    // }));

    // const populatedBrands = await Brand.find({
    //   _id: { $in: discount.brandIds }
    // }, 'name');

    // const brandObjects = populatedBrands.map(brand => ({
    //   _id: brand._id,
    //   name: brand.name
    // }));

    // const populatedDiscount = {
    //   ...discount.toObject(),
    //   categoryIds: categoryObjects,
    //   productIds: productObjects,
    //   brandIds: brandObjects,
    // };

    // res.json(populatedDiscount);
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