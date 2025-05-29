const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  shortName: String,
  longName: String,
  quantity: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    required: true
  },
  kind: {
    type: String,
    enum: ['IPO', 'EMIT', 'UPDATE'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);