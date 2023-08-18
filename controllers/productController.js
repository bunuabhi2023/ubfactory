const Product = require('../models/product');
const Brand = require('../models/brand'); 
const Category = require('../models/category');
const Size = require('../models/size');
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
});

// Function to create a new Product
const createProduct = async (req, res) => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'extraFiles', maxCount: 5 },
  ])(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading files' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    const { name, description, quantity, prices, categoryId, brandId, totalStock } = req.body;
    const createdBy = req.user.id;

    const file = req.files['file'] ? req.files['file'][0].filename : undefined;
    const extraFiles = req.files['extraFiles']
      ? req.files['extraFiles'].map((file) => file.filename)
      : [];

    const newProduct = new Product({
      name,
      description,
      quantity,
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
  });
};

const updateProduct = async (req, res) => {

    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'extraFiles', maxCount: 5 },
      ])(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: 'Error uploading files' });
        } else if (err) {
          return res.status(500).json({ error: 'Server error' });
        }

        const productId = req.params.id; 
        const { name,description, quantity, prices, categoryId, brandId } = req.body;
        const updatedBy = req.user.id;

        const file = req.files['file'] ? req.files['file'][0].filename : undefined;
        const extraFiles = req.files['extraFiles']
          ? req.files['extraFiles'].map((file) => file.filename)
          : [];
        
          try {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
              { name, description, quantity, file, prices, categoryId, brandId, extraFiles,  updatedBy, updatedAt: Date.now() },
              { new: true }
            );
      
            if (!updatedProduct) {
              console.log(`Product with ID ${req.params.id} not found`);
              return res.status(404).json({ error: 'Product not found' });
            }
      
            console.log(updatedProduct); // Add this line for debug logging
            res.json(updatedProduct);
          } catch (error) {
            console.error(error); // Add this line for debug logging
            return res.status(500).json({ error: 'Failed to update Product' });
          }
    
    
    });
  };

const getAllProducts = async (req, res) => {
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

            // const pricesArray = JSON.parse(product.prices); // Parse the prices string into an array

            // const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
            //     const sizeInfo = await Size.findById(price.sizeId).select('size'); // Adjust this based on your actual schema
            //   // console.log(sizeInfo);
            //     return {
            //         ...price,
            //         sizeName: sizeInfo ? sizeInfo.size : null,
            //     };
            // }));

            return {
                ...product._doc,
                fileUrl,
                extraFilesUrls,
               // prices: pricesWithSizeNames,
            };
        }));

        res.json(productsWithUrls);
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

      // const pricesArray = JSON.parse(product.prices);

      // const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
      //     const sizeInfo = await Size.findById(price.sizeId).select('size');
      //     return {
      //         ...price,
      //         sizeName: sizeInfo ? sizeInfo.size : null,
      //     };
      // }));

      const productWithUrls = {
          ...product._doc,
          fileUrl,
          extraFilesUrls,
          //prices: pricesWithSizeNames,
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

const updateAvailable = async(req, res) =>{
  try {
    const productId = req.params.id;
    const { isAvailable } = req.body; // Assuming you send the new value of isAvailable in the request body

    const product = await Product.findByIdAndUpdate(productId, { $set: { isAvailable } }, { new: true });

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({message: 'Availability Updated Successfuly'});
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update product availability' });
  }
};


module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateAvailable,
};
