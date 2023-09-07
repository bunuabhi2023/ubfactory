const multer = require("multer");
const { config } = require("dotenv");
const { S3 } = require("@aws-sdk/client-s3");
config();

const params = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1", // Set your desired region
  useAccelerateEndpoint: false, // Disable accelerated endpoint if not needed
};

// console.log(params);

// Create an S3 instance
const s3= new S3(params);

// Set the destination folder in your S3 bucket
const s3Destination = "uploads/";

// Create a multer storage engine for handling uploads
const multerConfig = multer();

// Middleware to handle single image upload to S3
exports.imageSingleUpload = (req, res, next) => {
  multerConfig.single("file")(req, res, (error) => {
    if (error) {
      console.error("Multer Error:", error);
      return next(new ErrorHandler("Multer upload failed", 500));
    }

    // Use the `req.file` object to access the uploaded file
    if (!req.file) {
      return next();
    }
    const uniqueKey = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${req.file.originalname}`;


    // Define the S3 upload parameters
    const s3Params = {
      Bucket: process.env.AWS_BUCKET, // Replace with your S3 bucket name
      Key: `${s3Destination}${uniqueKey}`, // Set the S3 key for the uploaded file
      Body: req.file.buffer, // Use the file buffer from Multer
      ContentType: req.file.mimetype, // Set the content type based on the file's mimetype
    //   ACL: "public-read", // Set access permissions as needed
    };

    s3.putObject(s3Params, (err, data) => {
      if (err) {
        console.error("S3 Upload Error:", err);
        return res.status(500).json({message:"S3 upload failed"});
      }

      // Optionally, you can store the S3 URL or other relevant information in the request for later use
      req.s3FileUrl = {
        Bucket: process.env.AWS_BUCKET, // Replace with your S3 bucket name
        Key: `${s3Destination}${uniqueKey}`, // Set the S3 key for the uploaded file
        Url: `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`,
      };

      next(); // Continue to the next middleware if upload is successful
    });
  });
};
