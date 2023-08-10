const Size = require('../models/size');

// Function to create a new Size
const createSize = async (req, res) => {
  
      const { size } = req.body;
      const createdBy = req.user.id;
  
  
      const newSize = new Size({ size, createdBy });
  
      try {
        const savedSize = await newSize.save();
        console.log(savedSize); // Add this line for debug logging
        res.json(savedSize);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to create size' });
      }
   
  };

  
// Function to update a category by ID
const updateSize = async (req, res) => {
    
  
      const { size } = req.body;
      const updatedBy = req.user.id;
  
  
      try {
        const updatedSize = await Size.findByIdAndUpdate(
          req.params.id,
          { size, updatedBy, updatedAt: Date.now() },
          { new: true }
        );
  
        if (!updatedSize) {
          console.log(`Size with ID ${req.params.id} not found`);
          return res.status(404).json({ error: 'Size not found' });
        }
  
        console.log(updatedSize); // Add this line for debug logging
        res.json(updatedSize);
      } catch (error) {
        console.error(error); // Add this line for debug logging
        return res.status(500).json({ error: 'Failed to update Size' });
      }
};

// Function to get all sizes
const getAllSize = async (req, res)  => {
    try {
        const sizes = await Size.find()
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .exec();
        res.json(sizes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch sizes' });
    }
};
  
  // Function to get a size by ID
const getSizeById = async (req, res) => {
try {
    const size = await Size.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .exec();
    if (!size) {
    console.log(`Size with ID ${req.params.id} not found`);
    return res.status(404).json({ error: 'Size not found' });
    }


    res.json(size);
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch size' });
}
};
  
  // Function to delete a Size by ID
const deleteSize = async (req, res) => {
    try {
      const deletedSize = await Size.findByIdAndDelete(req.params.id);
      if (!deletedSize) {
        console.log(`Size with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Size not found' });
      }
      res.json({ message: 'Size deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete Size' });
    }
};
  
  module.exports = {
    createSize,
    updateSize,
    getAllSize,
    getSizeById,
    deleteSize,
  };