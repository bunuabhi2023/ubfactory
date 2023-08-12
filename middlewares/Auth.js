const jwt = require("jsonwebtoken");
const user = require("../models/user");
require("dotenv").config();

exports.auth = async(req, res , next) => {
 
    const {token} = req.cookies;
    if(!token) {
        return res.status(404).json({
            success:false,
            message:'Unauthorized',
        })
    };
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const userId = decodedToken._id;
        console.log({userId, token,decodedToken})
        req.user = await user.findById(userId);
        next();
      } catch (err) {
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token',
      })
    }
 
}



exports.isAdmin = (req,res,next) => {
    try{
            if(req.user.role !== "Admin") {
                return res.status(405).json({
                    success:false,
                    message:'This is a protected route for Admin',
                });
            }
            next();
    }
    catch(error) {
        return res.status(405).json({
            success:false,
            message:'Method not allowed',
        })
    }
}

exports.isVendor = (req,res,next) => {
    try{
        if(req.user.role !== "Vendor") {
            return res.status(405).json({
                success:false,
                message:'This is a protected route for vendor',
            });
        }
        next();
}
catch(error) {
    return res.status(405).json({
        success:false,
        message:'Method not allowed',
    })
}
}