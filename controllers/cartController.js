const Cart = require('../models/cart');
const Product = require('../models/product');

const addToCart = async (req,res) =>{
    const { productId, sizeId,quantity} = req.body;
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;

    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: "Product not found" };
    }

    const priceInfo = product.prices.find(
      (priceObj) => priceObj.sizeId.toString() === sizeId
    );

    if (!priceInfo) {
      return { success: false, message: "Price not found for the selected size" };
    }

    const { price } = priceInfo;
    const totalPrice = parseFloat(price) * quantity;
    try {
        // Check if the customer's cart already exists, or create one
        let cart = await Cart.findOne({ customerId });
        if (!cart) {
        cart = new Cart({
            customerId,
            cartDetails: [],
            cartCount: 0,
        });
        }
    
        // Check if the product is already in the cart, update its quantity if so
        const existingProductIndex = cart.cartDetails.findIndex(
            (item) => item.productId.toString() === productId && item.sizeId.toString() === sizeId
        );
        
        if (existingProductIndex !== -1) {
        // If the same product with the same size is found, update the quantity and price
        const existingCartItem = cart.cartDetails[existingProductIndex];
        existingCartItem.quantity += quantity;
    
        // Update the price based on the new quantity
        const totalPrice = parseFloat(price) * existingCartItem.quantity;
        existingCartItem.price = totalPrice.toString();
        } else {
        // If the same product with a different size is found or the product is not in the cart, add a new entry
        const totalPrice = parseFloat(price) * quantity;
        const newCartItem = {
            productId,
            sizeId,
            quantity,
            price: totalPrice.toString(),
        };
        cart.cartDetails.push(newCartItem);
        }
    
        // Update the cartCount based on the count of objects in cartDetails array
        cart.cartCount = cart.cartDetails.length;
    
        // Update the cart in the database
        await cart.save();

        return res.status(200).json({message: "Product added to cart successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error adding product to cart" });
    }
}

module.exports = {
    addToCart,
  };