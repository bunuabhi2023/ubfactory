const Product = require('../models/product');
const Brand = require('../models/brand');
const Category = require('../models/category');
const Size = require('../models/size');
const multer = require('multer');


const { S3 } = require("@aws-sdk/client-s3");
const { config } = require('dotenv');
config();

const params = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1", // Set your desired region
  useAccelerateEndpoint: false, // Disable accelerated endpoint if not needed

};

const s3 = new S3(params);

// Function to create a new Product
const createProduct = async (req, res) => {
  const { name, description, categoryId, brandId, totalStock } = req.body;
  const createdBy = req.user.id;
  const prices = JSON.parse(req.body.prices);
  const file = req.s3FileUrls['file'][0];
  const extraFiles =req.s3FileUrls['extraFiles[]'] || [];

  const newProduct = new Product({
    name,
    description,
    prices,
    categoryId,
    file,
    createdBy,
    brandId,
    extraFiles,
    totalStock,
  });

  try {
    const savedProduct = await newProduct.save();
    console.log(savedProduct); // Add this line for debug logging
    res.json(savedProduct);
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: 'Failed to create Product' });
  }
};




const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { name, description, categoryId, brandId, removeFile } = req.body;
  const updatedBy = req.user.id;
  let prices;

  const file = req.s3FileUrls['file'] && req.s3FileUrls['file'][0]; // Use '&&' for better null-checking
  const extraFiles = req.s3FileUrls['extraFiles[]'] || [];

  console.log({ prices: req.body.prices });
  try {
    // Attempt to parse req.body.prices as JSON
    prices = JSON.parse(req.body.prices);
  } catch (error) {
    console.error(error); // Log the parsing error
    return res.status(400).json({ error: 'Invalid JSON format for prices' });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        file,
        prices,
        categoryId,
        brandId,
        updatedBy,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedProduct) {
      console.log(`Product with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle the removal of files
    if (removeFile && removeFile.length > 0) {
      const imagesToRemoveIds = removeFile; // Assuming you have an array like [_id, _id, _id]

      // Create an array to store Promise objects for each image deletion
      const deletePromises = imagesToRemoveIds.map((_id) => {
        const imageToDelete = updatedProduct.extraFiles.find(
          (img) => img._id.toString() === _id
        );

        if (imageToDelete) {
          return new Promise((resolve, reject) => {
            // Assuming you have defined the s3 object elsewhere in your code
            s3.deleteObject(imageToDelete, (err, data) => {
              if (err) {
                console.error("S3 Object Deletion Error:", err);
                reject(err);
              } else {
                console.log("Object Deleted Successfully");
                resolve();
              }
            });
          });
        }
      });

      // Wait for all image deletions to complete
      await Promise.all(deletePromises);

      // Remove the deleted files from updatedProduct
      updatedProduct.extraFiles = updatedProduct.extraFiles.filter(
        (img) => !imagesToRemoveIds.includes(img._id.toString())
      );
    }

    // Handle the addition of extraFiles
    if (extraFiles.length > 0) {
      updatedProduct.extraFiles.push(...extraFiles);
    }

    // Save the updated product
    await updatedProduct.save();

    console.log(updatedProduct); // Add this line for debug logging
    res.json(updatedProduct);
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: 'Failed to update Product' });
  }
};





const getAllProducts = async (req, res) => {
  try {

    const filters = {};

    if (req.query.categoryId) {
      filters.categoryId = req.query.categoryId;
    }

    const sortOptions = {};
    if (req.query.sort === 'new') {
      sortOptions.createdAt = -1;
    } else if (req.query.sort === 'price-low-to-high') {
      sortOptions['prices.price'] = 1;
    }
    const products = await Product.find(filters)
      .populate('brandId', 'name')
      .populate('categoryId', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort(sortOptions) // Apply sorting options
      .exec();
    res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};


const getProductById = async (req, res) => {
  try {
    const productId = req.params.id; // Assuming the parameter is named "productId" in the route
    const product = await Product.findById(productId)
      .populate('brandId', 'name')
      .populate('categoryId', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
    const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

    const pricesArray = product.prices;

    const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
      const sizeInfo = await Size.findById(price.sizeId).select('size');
      return {
        ...price._doc,
        sizeName: sizeInfo ? sizeInfo.size : null,
      };
    }));

    const productWithUrls = {
      ...product._doc,
      fileUrl,
      extraFilesUrls,
      prices: pricesWithSizeNames,
    };

    res.json(productWithUrls);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch the product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      console.log(`Product with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete Product' });
  }
};

const updateAvailable = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isAvailable } = req.body; // Assuming you send the new value of isAvailable in the request body

    const product = await Product.findByIdAndUpdate(productId, { $set: { isAvailable } }, { new: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ message: 'Availability Updated Successfuly' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update product availability' });
  }
};

const getBestSalingProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('brandId', 'name')
      .populate('categoryId', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();

    const productsWithUrls = await Promise.all(products.map(async (product) => {
      const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
      const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

      const pricesArray = product.prices;
      const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
        const sizeInfo = await Size.findById(price.sizeId).select('size'); // Adjust this based on your actual schema
        // console.log(sizeInfo);
        return {
          ...price._doc,
          sizeName: sizeInfo ? sizeInfo.size : null,
        };
      }));

      return {
        ...product._doc,
        fileUrl,
        extraFilesUrls,
        prices: pricesWithSizeNames,
      };
    }));

    // Sort products by saleCount in descending order
    productsWithUrls.sort((a, b) => b.saleCount - a.saleCount);

    // Get the top two products
    const topTwoProducts = productsWithUrls.slice(0, 10);

    res.json(topTwoProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductByCategory = async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
    const products = await Product.find({ categoryId })
      .populate('brandId', 'name')
      .populate('categoryId', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();

    const productsWithUrls = await Promise.all(products.map(async (product) => {
      const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
      const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

      const pricesArray = product.prices;
      const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
        const sizeInfo = await Size.findById(price.sizeId).select('size'); // Adjust this based on your actual schema
        // console.log(sizeInfo);
        return {
          ...price._doc,
          sizeName: sizeInfo ? sizeInfo.size : null,
        };
      }));

      return {
        ...product._doc,
        fileUrl,
        extraFilesUrls,
        prices: pricesWithSizeNames,
      };
    }));

    res.json(productsWithUrls);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products by category' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateAvailable,
  getBestSalingProducts,
  getProductByCategory,
};



