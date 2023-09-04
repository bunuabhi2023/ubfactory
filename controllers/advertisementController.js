const Advertisement = require('../models/advertisement');
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
  
//   const fileFilter = (req, file, cb) => {
//     // Check file type to allow only images
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only images are allowed.'), false);
//     }
//   };
  
  const upload = multer({
    storage: storage,
  }).single('file'); // Specify that this is a single file upload


const createAdvertisement = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    const { title} = req.body;
    const createdBy = req.user.id;
    const file = req.file ? req.file.filename : undefined;

    newAdvertisement = new Advertisement({
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
  });
};

const updateAdvertisement = async (req, res) => {
    
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    const { title} = req.body;
    const updatedBy = req.user.id;
    let updateFields = {
      title,
      updatedBy,
      updatedAt: Date.now(),
    };


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
  });
};

// Function to get all Advertisement
const getAllAdvertisement = async (req, res)  => {
  try {
    const advertisements = await Advertisement.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();
      
      const advertisementWithUrls = advertisements.map((advertisement) => {
        const imageUrl = advertisement.file ? `${req.protocol}://${req.get('host')}/uploads/${advertisement.file}` : null;
        return { ...advertisement._doc, imageUrl };
        });
        res.json(advertisementWithUrls);
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

    if (!advertisement) {
      console.log(`Advertisement with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Advertisement  not found' });
    }
    const imageUrl = advertisement.file ? `${req.protocol}://${req.get('host')}/uploads/${advertisement.file}` : null;
    const advertisementWithUrls = { ...advertisement._doc, imageUrl };

    res.json(advertisementWithUrls);
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

module.exports = {
    createAdvertisement,
    updateAdvertisement,
    getAllAdvertisement,
    getAdvertisementById,
    deleteAdvertisement
  };