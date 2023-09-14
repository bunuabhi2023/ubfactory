const Brand = require('../models/brand');


const createBrand = async (req, res) => {
      const { name } = req.body;
      const createdBy = req.user.id;
  
      const file = req.s3FileUrl;
  
      const newBrand = new Brand({ name, file, createdBy });
  
      try {
        const savedBrand = await newBrand.save();
        console.log(savedBrand); // Add this line for debug logging
        res.json(savedBrand);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to create Brand' });
      }
   
  };

  
// Function to update a Brand by ID
const updateBrand = async (req, res) => {
  
      const { name } = req.body;
      const updatedBy = req.user.id;
  
      const file = req.s3FileUrl;
  
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
};

// Function to get all Brands
const getAllBrands = async (req, res)  => {
    try {
        const brands = await Brand.find()
        .populate('createdBy', 'name')
        .populate('updatedBy','name')
        .exec();
        res.json(brands);
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


    res.json(brand);
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