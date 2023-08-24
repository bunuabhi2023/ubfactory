const jwt = require("jsonwebtoken");
const customer = require("../models/customer");
require("dotenv").config();

exports.customerAuth = async(req, res , next) => {
 
    let token;
    // Check for token in Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({
            success:false,
            message:'Not Logged In',
      })
    }
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
