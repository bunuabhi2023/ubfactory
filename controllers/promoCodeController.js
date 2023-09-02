const PromoCode = require('../models/promoCode');


const createPromoCode = async(req, res) =>{
    const {code, description, discountAmount, discountpercentage, termCondition, validityFrom, validityUpTo} = req.body;

    try {
        const currentDate = new Date();
        const promoCode = await PromoCode.findOne({code:code, validityUpTo:{$lt: currentDate} });

        if(promoCode){
            return res.status(400).json({ message: 'You have already same promo code' });
        }else{
            const promocode = new PromoCode({
                code,
                description,
                discountAmount,
                discountpercentage,
                termCondition,
                validityFrom,
                validityUpTo
            })

            const savedPromoCode = await promocode.save();
            
            return res.status(200).json({data: savedPromoCode, message: 'Promo Code Created Successfully' });

        }
    } catch (error) {
        
    }
}

const updatePromoCode = async (req, res) => {
    const promoId = req.params.id;
    const { code, description, discountAmount, discountpercentage, termCondition, validityFrom, validityUpTo } = req.body;

    try {
        const currentDate = new Date();
        // Find the existing promo code by its code
        const existingPromoCode = await PromoCode.findById(promoId);

        if (!existingPromoCode) {
            return res.status(404).json({ message: 'Promo code not found' });
        }

        // Check if the promo code is already expired
        if (existingPromoCode.validityUpTo < currentDate) {
            return res.status(400).json({ message: 'Promo code has already expired' });
        }

        // Update the promo code fields
        existingPromoCode.description = description;
        existingPromoCode.discountAmount = discountAmount;
        existingPromoCode.discountpercentage = discountpercentage;
        existingPromoCode.termCondition = termCondition;
        existingPromoCode.validityFrom = validityFrom;
        existingPromoCode.validityUpTo = validityUpTo;

        // Save the updated promo code
        const updatedPromoCode = await existingPromoCode.save();

        return res.status(200).json({ data: updatedPromoCode, message: 'Promo Code Updated Successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getAllPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find();
        return res.status(200).json({ data: promoCodes, message: 'Promo Codes Retrieved Successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getPromoCodeById = async (req, res) => {
    const promoCodeId = req.params.id; // Assuming you pass the promo code ID in the request parameters.

    try {
        const promoCode = await PromoCode.findById(promoCodeId);

        if (!promoCode) {
            return res.status(404).json({ message: 'Promo code not found' });
        }

        return res.status(200).json({ data: promoCode, message: 'Promo Code Retrieved Successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const deletePromoCode = async (req, res) => {
    const promoCodeId = req.params.id; // Assuming you pass the promo code ID in the request parameters.

    try {
        const deletedPromoCode = await PromoCode.findByIdAndDelete(promoCodeId);

        if (!deletedPromoCode) {
            return res.status(404).json({ message: 'Promo code not found' });
        }

        return res.status(200).json({ message: 'Promo Code Deleted Successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}




module.exports ={
    createPromoCode,
    updatePromoCode,
    getAllPromoCodes,
    getPromoCodeById,
    deletePromoCode

}