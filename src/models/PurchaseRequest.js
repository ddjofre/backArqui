const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'NOT_VALID', 'REJECTED', 'OK'],
    default: 'PENDING'
  },
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);