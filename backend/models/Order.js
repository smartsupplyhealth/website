const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true }, // 🔒 empêche les doublons
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: Object },
  notes: { type: String },
  mode: { type: String, enum: ['manuelle', 'auto', 'manual'], default: 'manuelle' },
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'Pending' },
  paymentDetails: { type: Object },
}, { timestamps: true });

OrderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Order', OrderSchema);
