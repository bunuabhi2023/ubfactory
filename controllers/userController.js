const User = require("../models/user");
const VendorProduct = require("../models/vendorProduct");
const Product = require("../models/product");
const Size = require("../models/size");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
require("dotenv").config();
const multer = require('multer');
const admin = require('firebase-admin'); 
const serviceAccount = require('../serviceAccount.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});



exports.signUp = async (req, res) => {
    try {
      const { name, email, mobile, password } = req.body;
  
      // Check if the email or mobile already exists in the database
      const existingUser = await User.findOne({
        $or: [{ email }, { mobile }],
      });
  
      if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile already exists' });
      }
  
      // Hash the password before saving it to the database
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Create the new customer object with the hashed password
      const newUser = new User({
        name,
        email,
        mobile,
        password: hashedPassword,
        email_otp: null,
        mobile_otp: null,
        dob: null,
        latitude: null,
        longitude: null,
        mobile_verified_at: null,
        email_verified_at: null,
        file: null,
        city: null,  
        pincode: null,
        address: null,
      });
  
      // Save the new customer to the database
      await newUser.save();
  
      return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error during customer signup:', error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  };
  


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
        let user = await User.findOne({email});
        //if not a registered user
        if(!user) {
            return res.status(401).json({
                success:false,
                message:'User is not registered',
            });
        }
        console.log(user._id)

        const payload = {
            email:user.email,
            _id:user._id,
            role:user.role,
        };
        //verify password & generate a JWT token
        if(await bcrypt.compare(password,user.password) ) {
            //password match
            let token =  jwt.sign(payload, 
                                process.env.JWT_SECRET,
                                {
                                    expiresIn:"15d",
                                });

                                
            const deviceId = await admin.auth().createCustomToken(user._id.toString()); // Assuming _id is the user's unique identifier

            // Store the device token in the user's record
            user.deviceId = deviceId;

            // Save the updated user record
            await user.save();
            user = user.toObject();
            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                httpOnly:true,
                sameSite: 'none',
                secure: true,
            }

            

            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:'User Logged in successfully',
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
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUser = async (req, res) => {
  try {

    const users = await User.find({role: 'Vendor'});

    if (!users) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ users });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUserById = async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const vendorProducts = await VendorProduct.find({ vendorId: req.params.id }).populate({ path: 'productId', populate: [{ path: 'categoryId', model: 'Category', select: 'name' }, { path: 'brandId', model: 'Brand', select: 'name' }]}).populate('sizeId', 'size').exec();


    return res.json({ user, vendorProducts });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updateUser = async(req,res) =>{
  

    const { name, email, mobile, dob, city, state, pincode,address, status} = req.body;
    const updatedBy = req.user.id;

    const file = req.s3FileUrl;

    try {
      const existingUser = await User.findById(req.params.id);

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      
      const duplicateUser = await User.findOne({
        $and: [
          { _id: { $ne: existingUser._id } }, 
          { $or: [{ email }, { mobile }] }, 
        ],
      });

      if (duplicateUser) {
        return res.status(400).json({ error: 'Email or mobile already exists for another user' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, mobile, dob, file, city, state, pincode,address, status, updatedBy, updatedAt: Date.now() },
        { new: true }
      );

      console.log(updatedUser); // Add this line for debug logging
      res.json(updatedUser);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update User' });
    }
}

exports.deleteUser = async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);
    if (!deleteUser) {
      console.log(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete User' });
  }
};

exports.updateUserStatus =async(req, res) =>{
  try {
    const updateStatus =await User.findOneAndUpdate(
      {_id:req.body.userId},
      {status: req.body.status},
      {new:true}
    );
    if (!updateStatus) {
      console.log(`User with ID ${req.body.UserId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User Status Updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to Update Status' });
  }
}
  