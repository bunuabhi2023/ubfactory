const CustomerAddress = require('../models/customerAddress');

// Add new address
const addAddress = async (req, res) => {
    try {
      const authenticatedUser = req.customer;
      const customerId = authenticatedUser._id;
      const {
        fullAddress,
        mobile,
        city,
        district,
        state,
        pincode,
        landmark,
        addressType,
        latitude,
        longitude
      } = req.body;
  
      const newAddressData = {
        customerId,
        fullAddress,
        mobile,
        addressType,
        pincode,
      };
  
      // Check if optional fields exist in req.body and add them if they do
      if (city) newAddressData.city = city;
      if (district) newAddressData.district = district;
      if (state) newAddressData.state = state;
      if (landmark) newAddressData.landmark = landmark;
      if (latitude) newAddressData.latitude = latitude;
      if (longitude) newAddressData.longitude = longitude;
  
      const newAddress = new CustomerAddress(newAddressData);
  
      const savedAddress = await newAddress.save();
      res.json(savedAddress);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred' });
    }
};
  

// Update address by ID
const updateAddress = async (req, res) => {
  try {
    console.log(req);
    const addressId = req.params.id;
    console.log(addressId)
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    const { fullAddress,
        mobile,
        city,
        district,
        state,
        pincode,
        landmark,
        addressType,
        latitude,
        longitude } = req.body;

    const updatedAddress = await CustomerAddress.findByIdAndUpdate(
      addressId,
      { customerId, fullAddress, mobile, city, district, state, pincode, landmark, addressType, latitude, longitude, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Get all addresses for a customer
const getAddresses = async (req, res) => {
  try {
    const authenticatedUser = req.customer;
    const customerId = authenticatedUser._id;
    const addresses = await CustomerAddress.find({ customerId });
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Get address by ID
const getAddressById = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await CustomerAddress.findById(addressId);
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

// Delete address by ID
const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const deletedAddress = await CustomerAddress.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
};

module.exports = {
  addAddress,
  updateAddress,
  getAddresses,
  getAddressById,
  deleteAddress,
};
