const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    maxDiscountAmount: {
        type: Number
    },
    usageLimit: {
        type: Number,
        default: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for faster lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive &&
        this.validFrom <= now &&
        this.validUntil >= now &&
        this.usedCount < this.usageLimit;
});

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (orderAmount) {
    if (!this.isValid || orderAmount < this.minOrderAmount) {
        return 0;
    }

    let discount = 0;

    if (this.type === 'percentage') {
        discount = (orderAmount * this.value) / 100;
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else if (this.type === 'fixed') {
        discount = Math.min(this.value, orderAmount);
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Method to check if coupon can be used
couponSchema.methods.canBeUsed = function (orderAmount, productIds = []) {
    if (!this.isValid || orderAmount < this.minOrderAmount) {
        return false;
    }

    // Check if coupon is applicable to specific products
    if (this.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(productId =>
            this.applicableProducts.some(applicableId =>
                applicableId.toString() === productId.toString()
            )
        );
        if (!hasApplicableProduct) {
            return false;
        }
    }

    return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
