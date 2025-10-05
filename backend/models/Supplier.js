// Supplier.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  companyName: { type: String, required: true },
  companyType: { type: String, enum: ['pharmaceutical', 'medical_device', 'laboratory', 'other'], required: true },
  address: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Hash password, compare methods etc. ici
// Middleware pour hasher le mot de passe avant sauvegarde
supplierSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Méthode pour comparer mot de passe
supplierSchema.methods.comparePassword = async function (supplierPassword) {
  return bcrypt.compare(supplierPassword, this.password);
};

module.exports = mongoose.model('Supplier', supplierSchema);
