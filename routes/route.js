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
const customerAddressController = require('../controllers/customerAddressController');
const vendorProductController = require('../controllers/vendorProductController');
const subscribedCustomerController = require('../controllers/subscribedCustomerController');
const orderController = require('../controllers/orderController');
const storeOrderController = require('../controllers/storeOrderController');
const requestController = require('../controllers/requestController');
const adminDashboardController =require('../controllers/adminDashboardController');
const vendorDashboardController =require('../controllers/vendorDashboardController');
const promoCodeController =require('../controllers/promoCodeController');


const {auth, isAdmin, isVendor}  = require('../middlewares/Auth');

const {customerAuth} = require('../middlewares/CustomerAuth');

//Admin Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.get("/my-profile", auth, userController.getMyProfile);//auth
router.put("/update-user/:id", auth, userController.updateUser);
router.put("/update-user-status", auth, isAdmin, userController.updateUserStatus);
router.get("/get-all-users", auth, isAdmin, userController.getUser);
router.get("/get-user-by-id/:id", auth, isAdmin, userController.getUserById);
router.delete("/delete-user/:id", auth, isAdmin, userController.deleteUser);

//Admin Dashboard Route//
router.get("/get-dashboard-data", auth, isAdmin, adminDashboardController.dashboardData);

//Vendor Dashboard Route//
router.get("/get-vendor-dashboard-data", auth, isVendor, vendorDashboardController.vendorDashboardData);

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

//Vendor Product Route//
router.post("/product-assign-to-vendor", auth, isAdmin, vendorProductController.assignProductsToVendor);
router.get("/get-product-vendor", auth, isVendor, vendorProductController.getVendorProducts);
router.get("/get-less-stock", auth, isVendor, vendorProductController.getLessStock);


//Discount Route//
router.post("/create-discount", auth, isAdmin,discountController.createDiscount);
router.put("/update-discount/:id", auth, isAdmin, discountController.updateDiscount);
router.get("/get-discount",  discountController.getAllDiscount);
router.get("/get-discount-by-id/:id",  discountController.getDiscountById);
router.delete('/delete-discount/:id', auth, isAdmin, discountController.deleteDiscount);

//Cart Route//
router.post("/add-to-cart",  customerAuth, cartController.addToCart);
router.post("/remove-item-from-cart",  customerAuth, cartController.removeFromCart);
router.get("/get-cart",  customerAuth, cartController.getCartDetails);

//Customer Address Route//
router.post("/add-address",  customerAuth, customerAddressController.addAddress);
router.put("/update-address/:id",  customerAuth, customerAddressController.updateAddress);
router.get("/get-address",  customerAuth, customerAddressController.getAddresses);
router.get("/get-address-by-id/:id",  customerAuth, customerAddressController.getAddressById);
router.delete("/delete-address/:id",  customerAuth, customerAddressController.deleteAddress);

// Subscription Route//
router.post("/add-subscription",  customerAuth, subscribedCustomerController.addSubscription);
router.post("/pay-now",  customerAuth, subscribedCustomerController.payNow);
router.post("/verify-payment",  customerAuth, subscribedCustomerController.successPayment);
router.get("/my-subscription",  customerAuth, subscribedCustomerController.getMySubscription);
router.get("/subscribed-customer", auth, isAdmin, subscribedCustomerController.getSubscribedCustomers);

//Order Routes//
router.post("/create-order", customerAuth, orderController.createOrder);
router.get("/get-my-order", customerAuth, orderController.getMyOrder);
router.get("/get-order", auth, orderController.getVendorOrder);
router.put("/update-order-status", auth, orderController.updateOrderStatus);
router.get("/get-all-order", auth, isAdmin, orderController.getAllOrderForAdmin);
router.get("/get-order-by-id/:orderId", auth, orderController.getOrderById);

router.post("/sale", auth, storeOrderController.sale);


//request Routes//
router.post("/generate-request", auth, requestController.request);
router.put("/update-request-status", auth, isAdmin, requestController.updateStatus);
router.get("/get-all-request", auth, isAdmin, requestController.getAllRequestByAdmin);
router.get("/get-my-request", auth, requestController.getMyRequest);

//promo code Routes//
router.post("/create-promo-code", auth, isAdmin, promoCodeController.createPromoCode);
router.put("/update-promo-code/:id", auth, isAdmin, promoCodeController.updatePromoCode);
router.get("/get-all-promo-code",  promoCodeController.getAllPromoCodes);
router.get("/get-promo-code-by-id/:id",  promoCodeController.getPromoCodeById);
router.delete("/delete-promo-code/:id", auth, isAdmin,  promoCodeController.deletePromoCode);



module.exports = router;