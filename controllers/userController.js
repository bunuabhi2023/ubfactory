const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
require("dotenv").config();

exports.signUp = async (req, res) => {
    try {
      const { name, email, mobile, password, role } = req.body;
  
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
        role,
        email_otp: null,
        mobile_otp: null,
        dob: null,
        latitude: null,
        longitude: null,
        mobile_verified_at: null,
        email_verified_at: null,
        status: null,
        file: null,
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

exports.getUser = async (req, res) => {
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

  