const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['IPO', 'EMIT', 'UPDATE', 'OWN_PURCHASE', 'EXTERNAL_PURCHASE'],
    required: true
  },
  data: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EventLog', eventLogSchema);