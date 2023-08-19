const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const sizeController = require('../controllers/sizeController');
const brandController = require('../controllers/brandController');
const productController = require('../controllers/productController');
const discountController = require('../controllers/discountController');
const customerController = require('../controllers/customerController');
const cartController =require('../controllers/cartController');

const {auth, isAdmin, isVendor}  = require('../middlewares/Auth');

const {customerAuth} = require('../middlewares/CustomerAuth');

//Admin Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.get("/my-profile", auth, userController.getUser);//auth
router.put("/update-user/:id", auth, userController.updateUser);


//Customer Route//
router.post("/register-customer", customerController.signup);
router.post("/login-customer", customerController.login);
router.get("/get-my-profile", customerAuth, customerController.getMyProfile);
router.put("/update-my-profile/:id", customerAuth, customerController.updateMyProfile);
router.get("/get-customer",  auth, isAdmin, customerController.getAllCustomers);
router.get('/get-customer-by-id/:id', auth, isAdmin, customerController.getCustomerById);
router.get("/get-my-wishlist",  customerAuth, customerController.getMyWishlist);
router.post("/add-to-wishlist",  customerAuth, customerController.addToWishList);
router.post("/remove-from-wishlist",  customerAuth, customerController.removeFromWishList);
router.post('/update-customer/:id', auth, isAdmin, customerController.updateCustomer);

//Category Route//
router.post("/create-category", auth, isAdmin, categoryController.createCategory);
router.put('/update-category/:id', auth, isAdmin,  categoryController.updateCategory);
router.get("/get-category",  categoryController.getAllCategories);
router.get('/get-category-by-id/:id', categoryController.getCategoryById);
router.delete('/delete-category/:id', auth, isAdmin, categoryController.deleteCategory);

//Size Route//
router.post("/create-size", auth, sizeController.createSize);
router.put('/update-size/:id', auth,  sizeController.updateSize);
router.get("/get-size",  sizeController.getAllSize);
router.get('/get-size-by-id/:id', sizeController.getSizeById);
router.delete('/delete-size/:id', auth, sizeController.deleteSize);

//Brand Route//
router.post("/create-brand", auth, isAdmin, brandController.createBrand);
router.put('/update-brand/:id', auth, isAdmin, brandController.updateBrand);
router.get("/get-brand",  brandController.getAllBrands);
router.get('/get-brand-by-id/:id', brandController.getBrandById);
router.delete('/delete-brand/:id', auth, isAdmin, brandController.deleteBrand);

//Product Route//
router.post("/create-product", auth, isAdmin, productController.createProduct);
router.put("/update-product/:id", auth, isAdmin, productController.updateProduct);
router.put("/update-product-availability/:id", auth, productController.updateAvailable);
router.get("/get-product",  productController.getAllProducts);
router.get("/get-product-by-id/:id",  productController.getProductById);
router.get("/get-product-by-category/:categoryId",  productController.getProductByCategory);
router.get("/get-best-saling-products",  productController.getBestSalingProducts);
router.delete('/delete-product/:id', auth, isAdmin, productController.deleteProduct);

//Discount Route//
router.post("/create-discount", auth, isAdmin,discountController.createDiscount);
router.put("/update-discount/:id", auth, isAdmin, discountController.updateDiscount);
router.get("/get-discount",  discountController.getAllDiscount);
router.get("/get-discount-by-id/:id",  discountController.getDiscountById);
router.delete('/delete-discount/:id', auth, isAdmin, discountController.deleteDiscount);

//Cart Route//
router.post("/add-to-cart",  customerAuth, cartController.addToCart);


module.exports = router;