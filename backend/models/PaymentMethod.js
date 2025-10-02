const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    stripePaymentMethodId: {
        type: String,
        required: true,
        unique: true
    },
    cardType: {
        type: String,
        required: true,
        enum: ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown']
    },
    last4: {
        type: String,
        required: true,
        length: 4
    },
    expiryMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    expiryYear: {
        type: Number,
        required: true,
        min: new Date().getFullYear()
    },
    cardholderName: {
        type: String,
        required: true
    },
    cvv: {
        type: String,
        required: true,
        length: 3 // We'll store CVV for validation (Note: In production, this should be encrypted)
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
paymentMethodSchema.index({ client: 1, isActive: 1 });
// Note: stripePaymentMethodId already has unique: true, so no need for additional index

// Method to check if CVV is correct
paymentMethodSchema.methods.validateCVV = function (inputCVV) {
    return this.cvv === inputCVV;
};

// Method to check if card is expired
paymentMethodSchema.methods.isExpired = function () {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    if (this.expiryYear < currentYear) {
        return true;
    }
    if (this.expiryYear === currentYear && this.expiryMonth < currentMonth) {
        return true;
    }
    return false;
};

// Method to get formatted expiry date
paymentMethodSchema.methods.getFormattedExpiry = function () {
    return `${this.expiryMonth.toString().padStart(2, '0')}/${this.expiryYear}`;
};

// Method to get masked card number
paymentMethodSchema.methods.getMaskedCard = function () {
    return `**** **** **** ${this.last4}`;
};

// Method to get display name
paymentMethodSchema.methods.getDisplayName = function () {
    return `${this.cardType.toUpperCase()} ending in ${this.last4} (expires ${this.getFormattedExpiry()})`;
};

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
