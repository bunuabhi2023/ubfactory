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



// Function to create a new Brand
const createBrand = async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Error uploading image' });
      } else if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  
      const { name } = req.body;
      const createdBy = req.user.id;
  
      const file = req.file ? req.file.filename : undefined;
  
      const newBrand = new Brand({ name, file, createdBy });
  
      try {
        const savedBrand = await newBrand.save();
        console.log(savedBrand); // Add this line for debug logging
        res.json(savedBrand);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to create Brand' });
      }
    });
  };

  
// Function to update a Brand by ID
const updateBrand = async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Error uploading image' });
      } else if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  
      const { name } = req.body;
      const updatedBy = req.user.id;
  
      const file = req.file ? req.file.filename : undefined;
  
      try {
        const updatedBrand = await Brand.findByIdAndUpdate(
          req.params.id,
          { name, file, updatedBy, updatedAt: Date.now() },
          { new: true }
        );
  
        if (!updatedBrand) {
          console.log(`Brand with ID ${req.params.id} not found`);
          return res.status(404).json({ error: 'Brand not found' });
        }
  
        console.log(updatedBrand); // Add this line for debug logging
        res.json(updatedBrand);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to update Brand' });
      }
    });
};

// Function to get all Brands
const getAllBrands = async (req, res)  => {
    try {
        const brands = await Brand.find()
        .populate('createdBy', 'name')
        .populate('updatedBy','name')
        .exec();
        const brandsWithUrls = brands.map((brand) => {
        const imageUrl = brand.file ? `${req.protocol}://${req.get('host')}/uploads/${brand.file}` : null;
        return { ...brand._doc, imageUrl };
        });
        res.json(brandsWithUrls);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch brands' });
    }
};
  
  // Function to get a Brand by ID
const getBrandById = async (req, res) => {
try {
    const brand = await Brand.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .exec();
    if (!brand) {
    console.log(`Brand with ID ${req.params.id} not found`);
    return res.status(404).json({ error: 'Brand not found' });
    }

    // Add image URL to the brand object
    const imageUrl = brand.file ? `${req.protocol}://${req.get('host')}/uploads/${brand.file}` : null;
    const brandWithUrl = { ...brand._doc, imageUrl };

    res.json(brandWithUrl);
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch brand' });
}
};
  
  // Function to delete a brandWithUrl by ID
const deleteBrand = async (req, res) => {
    try {
      const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
      if (!deletedBrand) {
        console.log(`Brand with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Brand not found' });
      }
      res.json({ message: 'Brand deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete brand' });
    }
};
  
  module.exports = {
    createBrand,
    updateBrand,
    getAllBrands,
    getBrandById,
    deleteBrand,
  };