const Advertisement = require('../models/advertisement');
const multer = require('multer');


const createAdvertisement = async (req, res) => {
  
    const { title} = req.body;
    const createdBy = req.user.id;
    const file = req.s3FileUrl;


    const newAdvertisement = new Advertisement({
    title,
    file,
    createdBy,
    });

    try {
      const savedAdvertisement = await newAdvertisement.save();
      console.log(savedAdvertisement); // Add this line for debug logging
      res.status(200).json({ message: 'Advertisement created Successfuly' });
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to create Advertisement' });
    }
};

const updateAdvertisement = async (req, res) => {
    
  const file = req.s3FileUrl;


    const { title} = req.body;
    const updatedBy = req.user.id;
    let updateFields = {
      title,
      updatedBy,
      updatedAt: Date.now(),
      
    };
    if(file) updateFields.file = file;


    try {
      const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      );

      if (!updatedAdvertisement) {
        console.log(`Advertisement with ID ${req.params.id} not found`);
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      console.log(updatedAdvertisement);
      res.json(updatedAdvertisement);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Advertisement' });
    }
 
};

// Function to get all Advertisement
const getAllAdvertisement = async (req, res)  => {
  try {
    const advertisements = await Advertisement.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();

        res.json(advertisements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
};



// Function to get a discount by ID
const getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();


    res.json(advertisement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch discount' });
  }
};


// Function to delete a discount by ID
const deleteAdvertisement = async (req, res) => {
  try {
    const deletedAdvertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!deletedAdvertisement) {
      console.log(`Advertisement with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete Advertisement' });
  }
};

const changeStatus = async(req, res) => {
  try {
    const id = req.params.id;
    const unpateStatus = await Advertisement.findByIdAndUpdate(
      {_id:id}, 
      {status:req.body.status},
      {new:true}
      );

    if(!unpateStatus){
      return res.status(404).json({error:"Advertisement Not Found"});
    }

    return res.status(200).json({message:"Advertisement Status Changed"});
  } catch (error) {
    return res.status(500).json({error:"Failed To Change Advertisement Status"});
  }
}

module.exports = {
    createAdvertisement,
    updateAdvertisement,
    getAllAdvertisement,
    getAdvertisementById,
    deleteAdvertisement,
    changeStatus
  };