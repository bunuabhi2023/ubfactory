const mongoose = require('mongoose');
require("dotenv").config();
const dbConnect = () =>{
    mongoose.connect(process.env.DATABASE_URL, {
        useNewurlParser : true,
        useUnifiedTopology : true,
    })
    .then(() =>{
        console.log("db Successfully Connected")
    })
    
    .catch((error) =>{
        console.log("db not connected");
        console.log(error.message);
        process.exit(1);
    });
}

module.exports = dbConnect;