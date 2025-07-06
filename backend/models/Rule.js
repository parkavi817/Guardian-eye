// Rule schema
const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  condition: { type: String, required: true },
  action: { type: String, required: true },
  category: { type: String, enum: ['Typing', 'Device', 'Location', 'Transaction', 'Other'], default: 'Other' },
  eventType: { type: String, enum: ['login', 'signup', 'session', 'order', 'all'], default: 'all' }, // ADDED FIELD
  severityImpact: { type: Number, min: 0, max: 100, default: 10 },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Rule', ruleSchema);