const Category = require('../models/category');


const createCategory = async (req, res) => {
 
    const { name } = req.body;
    const createdBy = req.user.id;

    const file = req.s3FileUrl;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }


      const newCategory = new Category({ name, file, createdBy });

      try {
        const savedCategory = await newCategory.save();
        console.log(savedCategory);
        res.json(savedCategory);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to create category' });
      }
  }

  
// Function to update a category by ID
const updateCategory = async (req, res) => {
 

    const { name } = req.body;
    const updatedBy = req.user.id;

    try {
      const categoryToUpdate = await Category.findById(req.params.id);

      if (!categoryToUpdate) {
        console.log(`Category with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Category not found' });
      }

      let fileUrl = categoryToUpdate.file; // Default to the existing image URL

      if (req.file) {
       const newfile = req.s3FileUrl;
        fileUrl = newfile;
      }

      // Update the category with the new data and image URL
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, file: fileUrl, updatedBy, updatedAt: Date.now() },
        { new: true }
      );

      console.log(updatedCategory); // Add this line for debug logging
      res.json(updatedCategory);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update category' });
    }
  };



// Function to get all categories
const getAllCategories = async (req, res)  => {
    try {
        const categories = await Category.find() 
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .exec();
        // const categoriesWithUrls = categories.map((category) => {
        // const imageUrl = category.file ? `${req.protocol}://${req.get('host')}/uploads/${category.file}` : null;
        // return { ...category._doc, imageUrl };
        // });
        res.json(categories);
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

    // // Add image URL to the category object
    // const imageUrl = category.file ? `${req.protocol}://${req.get('host')}/uploads/${category.file}` : null;
    // const categoryWithUrl = { ...category._doc, imageUrl };

    res.json(category);
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