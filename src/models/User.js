const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  contactInfo: String,
  wallet: {
    balance: {
      type: Number,
      default: 0
    }
  },
  portfolio: [{
    symbol: String,
    quantity: Number,
    averagePrice: Number,
    totalInvested: Number,
    status: {
      type: String,
      default: 'ACTIVE' // Estado inicial del portafolio
    }
  }],

  password: {
    type: String, 
    require: false
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);