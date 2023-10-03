const Discount = require("../models/discount");
const Category = require("../models/category");
const Product = require("../models/product");
const Brand = require("../models/brand");
const { S3 } = require("@aws-sdk/client-s3");

const params = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "ap-south-1", // Set your desired region
  useAccelerateEndpoint: false, // Disable accelerated endpoint if not needed
};

// Create an S3 instance
const s3 = new S3(params);

const createDiscount = async (req, res) => {
  const { title, productId, categoryId } = req.body;
  const createdBy = req.user.id;
  const file = req.s3FileUrl;
  console.log("yaha aa gai")

  let newDiscount;

  if (productId && categoryId) {
    newDiscount = new Discount({
      title,
      file,
      status: "Draft",
      productId, // Ensure this is a valid ObjectId
      createdBy,
      categoryId, // Ensure this is a valid ObjectId
    });
  } else if (productId) {
    newDiscount = new Discount({
      title,
      file,
      status: "Draft",
      productId, // Ensure this is a valid ObjectId
      createdBy,
    });
  } else if (categoryId) {
    newDiscount = new Discount({
      title,
      file,
      status: "Draft",
      createdBy,
      categoryId, // Ensure this is a valid ObjectId
    });
  } else {
    newDiscount = new Discount({
      title,
      file,
      status: "Draft",
      createdBy,
    });
  }

  try {
    const savedDiscount = await newDiscount.save();
    console.log(savedDiscount); // Add this line for debug logging
    res.status(200).json({ message: "Discount created Successfuly" });
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: "Failed to create Discount" });
  }
};

const updateDiscount = async (req, res) => {
  const { title, status, productId, categoryId } = req.body;
  const updatedBy = req.user.id;
  const file = req.s3FileUrl;
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

    if (file) {
      const prevFile = updatedDiscount.file;
      s3.deleteObject(prevFile, (err, data) => {});
      updatedDiscount.file = file;
     await updatedDiscount.save();
    }
    if (!updatedDiscount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "Discount not found" });
    }

    console.log(updatedDiscount);
    res.json(updatedDiscount);
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: "Failed to update Discount" });
  }
};

// Function to get all discount
const getAllDiscount = async (req, res) => {
  try {
    const discounts = await Discount.find()
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .populate("categoryId", "name")
      .populate("productId", "name")
      .exec();


    res.json(discounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch discounts" });
  }
};

// Function to get a discount by ID
const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .populate("categoryId", "name")
      .populate("productId", "name")
      .exec();

    if (!discount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "Discount not found" });
    }


    res.json(discount);
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
    return res.status(500).json({ error: "Failed to fetch discount" });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    const deletedDiscount = await Discount.findByIdAndDelete(req.params.id);
    if (!deletedDiscount) {
      console.log(`Discount with ID ${req.params.id} not found`);
      return res.status(404).json({ error: "Discount not found" });
    }
    console.log(deletedDiscount.file)
    if(deletedDiscount.file)
    {
      const prevFile = deletedDiscount.file;
      s3.deleteObject(prevFile, (err, data) => {});
    }
    res.json({ message: "DIscount deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete Discount" });
  }
};

module.exports = {
  createDiscount,
  updateDiscount,
  getAllDiscount,
  getDiscountById,
  deleteDiscount,
};
