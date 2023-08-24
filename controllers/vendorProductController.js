const VendorProduct = require('../models/vendorProduct');
const Product = require('../models/product');
const Size = require('../models/size');

const assignProductsToVendor = async(req, res)=> {
    try {
      const { vendorId, products } = req.body; // products is an array of { productId, totalStock }
  
      // Create an array to store the created vendorProduct documents
      const createdVendorProducts = [];
  
      // Loop through each product in the products array and create a vendorProduct
      for (const productData of products) {
        const { productId, totalStock } = productData;
        
        // Create a new VendorProduct document
        const newVendorProduct = new VendorProduct({
          vendorId: vendorId,
          productId: productId,
          totalStock: totalStock,
        });
  
        // Save the document to the database
        const savedVendorProduct = await newVendorProduct.save();
        createdVendorProducts.push(savedVendorProduct);
      }
  
      res.status(201).json({ message: 'Products assigned to vendor successfully', createdVendorProducts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while assigning products to vendor' });
    }
}

const getVendorProducts = async (req, res)=> {
    try {
        const authenticatedUser = req.user;

        const userId = authenticatedUser._id;
        const role = authenticatedUser.role;
      // Check if the user's role is "Vendor"
      if (role !== 'Vendor') {
        return res.status(403).json({ error: 'Access denied.' });
      }
  
      // Retrieve vendor products based on the vendor's userId
      const vendorProducts = await VendorProduct.find({ vendorId: userId }).populate('productId');
      const productsWithUrls = await Promise.all(vendorProducts.map(async (vendorProduct) => {
        const product = vendorProduct.productId;
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
      res.status(200).json({ productsWithUrls });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching vendor products' });
    }
}
  
module.exports = {
assignProductsToVendor,
getVendorProducts,
};