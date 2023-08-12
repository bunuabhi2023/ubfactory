const jwt = require("jsonwebtoken");
const customer = require("../models/customer");
require("dotenv").config();

exports.customerAuth = async(req, res , next) => {
 
    const {token} = req.cookies;
    if(!token) {
        return res.status(404).json({
            success:false,
            message:'Unauthorized',
        })
    };
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const customerId = decodedToken._id;
        console.log({customerId, token,decodedToken})
        req.customer = await customer.findById(customerId);
        next();
      } catch (err) {
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token',
      })
    }
 
}
