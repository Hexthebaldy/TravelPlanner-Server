const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  query: {
    type: String,
    required: [true, '查询内容不能为空']
  },
  response: {
    type: String,
    required: [true, '响应内容不能为空']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 索引以提高查询性能
ConversationSchema.index({ user: 1, trip: 1, timestamp: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);