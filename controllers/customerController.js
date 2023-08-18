const Customer = require ('../models/customer');
const Product = require('../models/product');
const Size = require('../models/size');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
require("dotenv").config();
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
  }).single('file');


exports.signup = async(req,res) =>{
    try {
        const { name, email, mobile, password, username } = req.body;
    
        // Check if the email or mobile already exists in the database
        const existingCustomer = await Customer.findOne({
          $or: [{ email }, { mobile }, { username }],
        });
    
        if (existingCustomer) {
          return res.status(400).json({ message: 'Email or mobile or Username already exists' });
        }
    
        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        // Create the new customer object with the hashed password
        const newCustomer = new Customer({
          name,
          email,
          mobile,
          password: hashedPassword,
          username,
          email_otp: null,
          mobile_otp: null,
          dob: null,
          latitude: null,
          longitude: null,
          mobile_verified_at: null,
          email_verified_at: null,
          file: null,
        });
    
        // Save the new customer to the database
        await newCustomer.save();
    
        return res.status(201).json({ message: 'Customer created successfully' });
      } catch (error) {
        console.error('Error during customer signup:', error);
        return res.status(500).json({ message: 'Something went wrong' });
      }
}

exports.login = async (req,res) => {
    try {

        //data fetch
        const {email, password} = req.body;
        //validation on email and password
        if(!email || !password) {
            return res.status(400).json({
                success:false,
                message:'PLease fill all the details carefully',
            });
        }

        //check for registered user
        let customer = await Customer.findOne({email});
        //if not a registered user
        if(!customer) {
            return res.status(401).json({
                success:false,
                message:'customer is not registered',
            });
        }
        console.log(customer._id)

        const payload = {
            email:customer.email,
            _id:customer._id,
        };
        //verify password & generate a JWT token
        if(await bcrypt.compare(password,customer.password) ) {
            //password match
            let token =  jwt.sign(payload, 
                                process.env.JWT_SECRET,
                                {
                                    expiresIn:"15d",
                                });

                                

            customer = customer.toObject();
            customer.token = token;
            customer.password = undefined;

            const options = {
                expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                httpOnly:true,
                sameSite: 'none',
                secure: true,
            }

            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                customer,
                message:'customer Logged in successfully',
            });
        }
        else {
            //passwsord do not match
            return res.status(403).json({
                success:false,
                message:"Password Incorrect",
            });
        }

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure',
        });

    }
}

exports.getMyProfile = async (req, res) => {
    try {
      const authenticatedUser = req.customer;
  
      const customerId = authenticatedUser._id;
  
      const customer = await Customer.findById(customerId).select('-password');
  
      if (!customer) {
        return res.status(404).json({ message: 'customer not found' });
      }

      const imageUrl = customer.file ? `${req.protocol}://${req.get('host')}/uploads/${customer.file}` : null;
    const customerWithUrl = { ...customer._doc, imageUrl };
  
      return res.json({ customerWithUrl });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.updateMyProfile = async(req, res) =>{
        upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: 'Error uploading image' });
        } else if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
    
        const { name, email, mobile, dob, username } = req.body;
        const updatedBy = req.customer.id;
    
        const file = req.file ? req.file.filename : undefined;
    
        try {
          const existingCustomer = await Customer.findById(req.params.id);
    
          if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
          }
    
          // Check if the provided email or mobile already exist for other customers
          const duplicateCustomer = await Customer.findOne({
            $and: [
              { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
              { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
            ],
          });
    
          if (duplicateCustomer) {
            return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
          }
    
          const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            { name, email, mobile, dob, username, file, updatedBy, updatedAt: Date.now() },
            { new: true }
          );
    
          console.log(updatedCustomer); // Add this line for debug logging
          res.json(updatedCustomer);
        } catch (error) {
          console.error(error); // Add this line for debug logging
          return res.status(500).json({ error: 'Failed to update Customer' });
        }
      });
}


exports.getAllCustomers = async (req, res)  => {
    try {
        const customers = await Customer.find().select('-password');
        const customersWithUrls = customers.map((customer) => {
        const imageUrl = customer.file ? `${req.protocol}://${req.get('host')}/uploads/${customer.file}` : null;
        return { ...customer._doc, imageUrl };
        });
        res.json(customersWithUrls);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
  
  
exports.getCustomerById = async (req, res) => {
  try {
      const customer = await Customer.findById(req.params.id).select('-password');
      if (!customer) {
      console.log(`customer with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'customer not found' });
      }

    
      const imageUrl = customer.file ? `${req.protocol}://${req.get('host')}/uploads/${customer.file}` : null;
      const customerWithUrl = { ...customer._doc, imageUrl };

      res.json(customerWithUrl);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

exports.updateCustomer = async(req,res) =>{
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    const { name, email, mobile, dob, username } = req.body;
    const updatedBy = req.user.id;

    const file = req.file ? req.file.filename : undefined;

    try {
      const existingCustomer = await Customer.findById(req.params.id);

      if (!existingCustomer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if the provided email or mobile already exist for other customers
      const duplicateCustomer = await Customer.findOne({
        $and: [
          { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
          { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
        ],
      });

      if (duplicateCustomer) {
        return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        { name, email, mobile, dob, username, file, updatedBy, updatedAt: Date.now() },
        { new: true }
      );

      console.log(updatedCustomer); // Add this line for debug logging
      res.json(updatedCustomer);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Customer' });
    }
  });
}

exports.getMyWishlist = async(req, res) =>{
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;

    const customer = await Customer.findById(customerId).select('-password').populate('wishList');

    if (!customer) {
      return res.status(404).json({ message: 'customer not found' });
    }

    const wishlistDetails = await Promise.all(customer.wishList.map(async (wishlistItem) => {
      console.log(wishlistItem._id);
      const product = await Product.findById(wishlistItem._id)
        .populate('brandId', 'name')
        .populate('categoryId', 'name')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .exec();
    
    if (!product) {
      return null; // Handle the case where the product is not found
    }
    const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
    const extraFilesUrls = product.extraFiles.map((extraFile) => `${req.protocol}://${req.get('host')}/uploads/${extraFile}`);

    const pricesArray = JSON.parse(product.prices);

    const pricesWithSizeNames = await Promise.all(pricesArray.map(async (price) => {
        const sizeInfo = await Size.findById(price.sizeId).select('size');
        return {
            ...price,
            sizeName: sizeInfo ? sizeInfo.size : null,
        };
    }));

    const productWithUrls = {
        ...product._doc,
        fileUrl,
        extraFilesUrls,
        prices: pricesWithSizeNames,
    };
      return productWithUrls;
  }));

    return res.json({ wishlistDetails });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

exports.addToWishList = async (req, res) => {
  try {

    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const {productId } = req.body; 

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.wishList.includes(productId)) {
      customer.wishList.push(productId);
      await customer.save();
    }

    return res.status(200).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};

exports.removeFromWishList = async (req, res) => {
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const { productId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const productIndex = customer.wishList.indexOf(productId);
    if (productIndex !== -1) {
      customer.wishList.splice(productIndex, 1); // Remove the product from the wishlist array
      await customer.save();
      return res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } else {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};
