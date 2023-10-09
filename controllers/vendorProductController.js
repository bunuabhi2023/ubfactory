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
        const { productId, sizeId, totalStock } = productData;
        
        // Find existing VendorProduct document
      const existingVendorProduct = await VendorProduct.findOne({
        vendorId: vendorId,
        productId: productId,
        sizeId: sizeId,
      });

      if (existingVendorProduct) {
        // Update existing VendorProduct's totalStock
        existingVendorProduct.totalStock += totalStock;
        await existingVendorProduct.save();
        createdVendorProducts.push(existingVendorProduct);
      } else {
        // Create a new VendorProduct document
        const newVendorProduct = new VendorProduct({
          vendorId: vendorId,
          productId: productId,
          sizeId: sizeId,
          totalStock: totalStock,
        });

        const savedVendorProduct = await newVendorProduct.save();
        createdVendorProducts.push(savedVendorProduct);
      }
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
      const vendorProducts = await VendorProduct.find({ vendorId: userId }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category', select: 'name' }, { path: 'brandId', model: 'Brand', select: 'name' }]}).populate('sizeId', 'size').exec();

      if(!vendorProducts)        res.status(200).json({ productsWithUrls:[] });

      const productsWithUrls = await Promise.all(vendorProducts.map(async (vendorProduct) => {
        const product = vendorProduct?.productId;

          const pricesArray = product?.prices;
          let pricesWithSizeNames ;
          if(pricesArray)
        { pricesWithSizeNames =  await Promise.all(pricesArray?.map(async (price) => {
            const sizeInfo = await Size.findById(price.sizeId).select('size'); // Adjust this based on your actual schema
            // console.log(sizeInfo);
              return {
                  ...price._doc,
                  sizeName: sizeInfo ? sizeInfo.size : null,
              };
          }));}

          return {
            ...product?._doc,
             sizeId:vendorProduct.sizeId,
             totalStock: vendorProduct.totalStock,
              prices: pricesWithSizeNames,
          };
      }));

    
      res.status(200).json({ productsWithUrls });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching vendor products' });
    }
}

const getLessStock = async (req, res)=> {
  try {
      const authenticatedUser = req.user;

      const userId = authenticatedUser._id;
      const role = authenticatedUser.role;
    // Check if the user's role is "Vendor"
    if (role !== 'Vendor') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Retrieve vendor products based on the vendor's userId
    const vendorProducts = await VendorProduct.find({ vendorId: userId, totalStock:{ $lte: 10 } }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category', select: 'name' }, { path: 'brandId', model: 'Brand', select: 'name' }]}).populate('sizeId', 'size').exec();

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
           sizeId:vendorProduct.sizeId,
           totalStock: vendorProduct.totalStock,
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
getLessStock,
};