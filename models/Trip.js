const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: String,
    required: [true, '请提供目的地']
  },
  startDate: {
    type: Date,
    required: [true, '请提供开始日期']
  },
  endDate: {
    type: Date,
    required: [true, '请提供结束日期'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: '结束日期必须晚于开始日期'
    }
  },
  budget: {
    type: Number,
    required: [true, '请提供预算']
  },
  interests: {
    type: [String],
    required: [true, '请提供至少一个兴趣点'],
    enum: ['历史', '自然', '美食', '购物', '艺术', '冒险', '放松', '文化', '娱乐', '其他']
  },
  travelStyle: {
    type: String,
    enum: ['奢华', '经济', '冒险', '文化', '休闲', '家庭', '商务', '浪漫', '自助', '定制'],
    default: '自助'
  },
  specialRequirements: {
    type: String
  },
  plan: {
    type: String,
    required: true
  },
  itinerary: [{
    day: Number,
    activities: [{
      time: String,
      description: String,
      location: String,
      notes: String
    }]
  }],
  accommodations: [{
    name: String,
    address: String,
    checkIn: Date,
    checkOut: Date,
    price: Number,
    bookingReference: String,
    notes: String
  }],
  transportation: [{
    type: String,
    from: String,
    to: String,
    departureTime: Date,
    arrivalTime: Date,
    bookingReference: String,
    price: Number,
    notes: String
  }],
  status: {
    type: String,
    enum: ['计划中', '已确认', '进行中', '已完成', '已取消'],
    default: '计划中'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', TripSchema);