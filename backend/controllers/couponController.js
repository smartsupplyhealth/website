const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// Validate coupon code
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount, productIds = [] } = req.body;

        if (!code || !orderAmount) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and order amount are required'
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase().trim(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid coupon code'
            });
        }

        // Check if coupon can be used
        const canBeUsed = coupon.canBeUsed(orderAmount, productIds);
        if (!canBeUsed) {
            let message = 'Coupon cannot be used';
            if (orderAmount < coupon.minOrderAmount) {
                message = `Minimum order amount of €${coupon.minOrderAmount} required`;
            } else if (coupon.usedCount >= coupon.usageLimit) {
                message = 'Coupon usage limit exceeded';
            } else if (coupon.validUntil < new Date()) {
                message = 'Coupon has expired';
            } else if (coupon.validFrom > new Date()) {
                message = 'Coupon is not yet valid';
            }

            return res.status(400).json({
                success: false,
                message
            });
        }

        // Calculate discount
        const discountAmount = coupon.calculateDiscount(orderAmount);
        const finalAmount = orderAmount - discountAmount;

        res.json({
            success: true,
            coupon: {
                id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value,
                discountAmount,
                finalAmount,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscountAmount: coupon.maxDiscountAmount
            }
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all active coupons (for admin)
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({
            success: true,
            coupons
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create new coupon (for admin)
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            type,
            value,
            minOrderAmount = 0,
            maxDiscountAmount,
            usageLimit = 1,
            validUntil,
            applicableProducts = []
        } = req.body;

        // Validate required fields
        if (!code || !description || !type || !value || !validUntil) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate type and value
        if (!['percentage', 'fixed'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "percentage" or "fixed"'
            });
        }

        if (value <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Value must be greater than 0'
            });
        }

        if (type === 'percentage' && value > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage value cannot exceed 100'
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({
            code: code.toUpperCase().trim()
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const coupon = new Coupon({
            code: code.toUpperCase().trim(),
            description,
            type,
            value,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            validUntil: new Date(validUntil),
            applicableProducts
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            coupon
        });

    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update coupon usage count
exports.useCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon can still be used
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit exceeded'
            });
        }

        // Increment usage count
        coupon.usedCount += 1;
        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon used successfully',
            remainingUses: coupon.usageLimit - coupon.usedCount
        });

    } catch (error) {
        console.error('Error using coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get coupon statistics (for admin)
exports.getCouponStats = async (req, res) => {
    try {
        const totalCoupons = await Coupon.countDocuments();
        const activeCoupons = await Coupon.countDocuments({ isActive: true });
        const expiredCoupons = await Coupon.countDocuments({
            validUntil: { $lt: new Date() }
        });
        const usedCoupons = await Coupon.countDocuments({
            usedCount: { $gt: 0 }
        });

        res.json({
            success: true,
            stats: {
                totalCoupons,
                activeCoupons,
                expiredCoupons,
                usedCoupons
            }
        });
    } catch (error) {
        console.error('Error fetching coupon stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
