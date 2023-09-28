const multer = require("multer");
const { config } = require("dotenv");
const { S3 } = require("@aws-sdk/client-s3");
const ErrorHandler = require("../Utils/ErrorHandler");
config();


const params = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: "ap-south-1", // Set your desired region
  useAccelerateEndpoint: false, // Disable accelerated endpoint if not needed
};

// const params = {
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: "ap-south-1", // Set your desired region
//   useAccelerateEndpoint: false, // Disable accelerated endpoint if not needed
// };



// console.log(params);

// Create an S3 instance
const s3 = new S3(params);

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
        return res.status(500).json({ message: "S3 upload failed" });
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









// Middleware to handle multiple image uploads to S3
exports.imageMultiUpload = (req, res, next) => {
  multerConfig.array("images[]")(req, res, (error) => {
    if (error) {
      console.error("Multer Error:", error);
      return next(new ErrorHandler("Multer upload failed", 500));
    }

    if (!req.files || req.files.length === 0) {
      req.files = []
    }
    const uploadPromises = req.files.map((file) => {
      const uniqueKey = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${file.originalname}`;

      const s3Params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${s3Destination}${uniqueKey}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: "public-read",
      };

      return new Promise((resolve, reject) => {

        s3.putObject(s3Params, (err, data) => {
          if (err) {
            console.error("S3 Upload Error:", err);
            reject(err);
          }
          else {
            if (!req.s3FileUrls) {
              req.s3FileUrls = [];
            }
            req.s3FileUrls.push({
              Bucket: process.env.AWS_BUCKET,
              Key: `${s3Destination}${uniqueKey}`,
              Url: `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`,
            });
            console.log({ s3FileUrls: req.s3FileUrls });
            resolve(data);
          }
        });
      });
    });

    Promise.all(uploadPromises)
      .then(() => {
        next();
      })
      .catch((err) => {
        console.log({ err });
        next(new ErrorHandler("S3 upload failed", 500));
      });
  });
};
