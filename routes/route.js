const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const sizeController = require('../controllers/sizeController');
const {auth, isAdmin, isVendor}  = require('../middlewares/Auth');

//Admin Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.get("/my-profile", auth, userController.getUser);//auth


//Category Route//
router.post("/create-category", auth, categoryController.createCategory);
router.put('/update-category/:id', auth,  categoryController.updateCategory);
router.get("/get-category",  categoryController.getAllCategories);
router.get('/get-category-by-id/:id', categoryController.getCategoryById);
router.delete('/delete-category/:id', auth, categoryController.deleteCategory);

//Size Route//
router.post("/create-size", auth, sizeController.createSize);
router.put('/update-size/:id', auth,  sizeController.updateSize);
router.get("/get-size",  sizeController.getAllSize);
router.get('/get-size-by-id/:id', sizeController.getSizeById);
router.delete('/delete-size/:id', auth, sizeController.deleteSize);

module.exports = router;