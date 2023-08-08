const Category = require('../models/category');
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



// Function to create a new category
const createCategory = async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Error uploading image' });
      } else if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
  
      const { name } = req.body;
      const createdBy = req.user.id;
  
      const file = req.file ? req.file.filename : undefined;
  
      const newCategory = new Category({ name, file, createdBy });
  
      try {
        const savedCategory = await newCategory.save();
        console.log(savedCategory); // Add this line for debug logging
        res.json(savedCategory);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to create category' });
      }
    });
  };

  
// Function to update a category by ID
const updateCategory = async (req, res) => {
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
        const updatedCategory = await Category.findByIdAndUpdate(
          req.params.id,
          { name, file, updatedBy, updatedAt: Date.now() },
          { new: true }
        );
  
        if (!updatedCategory) {
          console.log(`Category with ID ${req.params.id} not found`);
          return res.status(404).json({ error: 'Category not found' });
        }
  
        console.log(updatedCategory); // Add this line for debug logging
        res.json(updatedCategory);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to update category' });
      }
    });
};

// Function to get all categories
const getAllCategories = async (req, res)  => {
    try {
        const categories = await Category.find()
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .exec();
        const categoriesWithUrls = categories.map((category) => {
        const imageUrl = category.file ? `${req.protocol}://${req.get('host')}/uploads/${category.file}` : null;
        return { ...category._doc, imageUrl };
        });
        res.json(categoriesWithUrls);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
    }
};
  
  // Function to get a category by ID
const getCategoryById = async (req, res) => {
try {
    const category = await Category.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .exec();
    if (!category) {
    console.log(`Category with ID ${req.params.id} not found`);
    return res.status(404).json({ error: 'Category not found' });
    }

    // Add image URL to the category object
    const imageUrl = category.file ? `${req.protocol}://${req.get('host')}/uploads/${category.file}` : null;
    const categoryWithUrl = { ...category._doc, imageUrl };

    res.json(categoryWithUrl);
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch category' });
}
};
  
  // Function to delete a category by ID
const deleteCategory = async (req, res) => {
    try {
      const deletedCategory = await Category.findByIdAndDelete(req.params.id);
      if (!deletedCategory) {
        console.log(`Category with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
};
  
  module.exports = {
    createCategory,
    updateCategory,
    getAllCategories,
    getCategoryById,
    deleteCategory,
  };