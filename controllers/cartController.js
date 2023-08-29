const Cart = require('../models/cart');
const Product = require('../models/product');
const Size = require('../models/size');

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

const removeFromCart = async (req, res) => {
    try {
        const itemId  = req.body.itemId;
        console.log(itemId);
        
        const authenticatedUser = req.customer;
        const customerId = authenticatedUser._id;
    
        // Find the cart by ID
        let cart = await Cart.findOne({ customerId });
    
        if (!cart) {
          return res.status(404).json({ message: 'Cart not found' });
        }
    
        // Find the item in the cartDetails array
        const item = cart.cartDetails.find(item => item._id.toString() === itemId);
    console.log(item);
        if (!item) {
          return res.status(404).json({ message: 'Item not found in cart' });
        }
    
       

        // Decrease the quantity of the item
        if (item.quantity > 1) {
            item.quantity--;
    
            // Update the price accordingly
            item.price = ((parseFloat(item.price) / (item.quantity + 1))* item.quantity).toString();
           
        } else {
            // If the quantity is 1, remove the item from the array and decrease the total price
            cart.cartDetails = cart.cartDetails.filter(item => item._id.toString() !== itemId);
        }
    
        // Save the updated cart
        await cart.save();
    
        res.json({ message: 'item removed from cart' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
      }
}

const getCartDetails = async (req, res) => {
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    const cart = await Cart.findOne({ customerId: customerId, isOrdered:false})
      .populate('cartDetails.productId')
      .populate('cartDetails.sizeId');
  
    if (!cart) {
      return res.status(200).json( {date: cart, message:"cart is Empty" });
    }
  
    // Calculate total price
    const totalPrice = cart.cartDetails.reduce((total, item) => {
      return total + parseFloat(item.price);
    }, 0);
  
    // Map cartDetails to include product image URLs
    const cartDetailsWithUrls = await Promise.all(cart.cartDetails.map(async (item) => {
      const product = item.productId;
      const fileUrl = product.file ? `${req.protocol}://${req.get('host')}/uploads/${product.file}` : null;
      
      return {
        itemId: item._id,
        productId: product._id,
        productName: product.name,
        fileUrl,
        sizeDetails: item.sizeId, 
        quantity: item.quantity,
        price: item.price,
      };
    }));
  
    return res.status(200).json( { cart: { ...cart._doc, cartDetails: cartDetailsWithUrls }, totalPrice });
  };

module.exports = {
    addToCart,
    removeFromCart,
    getCartDetails
  };