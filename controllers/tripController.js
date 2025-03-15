const Trip = require('../models/Trip');
const tripPlannerAgent = require('../services/agents/tripPlannerAgent');
const transportAgent = require('../services/agents/transportAgent');
const accommodationAgent = require('../services/agents/accommodationAgent');
const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/appError');

// @desc    创建新行程
// @route   POST /api/trips
// @access  Private
exports.createTrip = asyncHandler(async (req, res) => {
  const { destination, startDate, endDate, budget, interests, travelStyle, specialRequirements } = req.body;
  
  // 计算行程天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // 使用AI代理生成行程计划
  const tripPlanResult = await tripPlannerAgent.generateTripPlan({
    destination,
    duration,
    budget,
    interests,
    travelStyle,
    specialRequirements
  });
  
  if (!tripPlanResult.success) {
    throw new AppError('行程生成失败', 500);
  }
  
  // 创建行程记录
  const trip = await Trip.create({
    user: req.user.id,
    destination,
    startDate,
    endDate,
    budget,
    interests,
    travelStyle,
    specialRequirements,
    plan: tripPlanResult.plan
  });
  
  res.status(201).json({
    success: true,
    data: trip
  });
});

// @desc    获取用户所有行程
// @route   GET /api/trips
// @access  Private
exports.getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    count: trips.length,
    data: trips
  });
});

// @desc    获取单个行程
// @route   GET /api/trips/:id
// @access  Private
exports.getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权访问此行程', 403);
  }
  
  res.status(200).json({
    success: true,
    data: trip
  });
});

// @desc    更新行程
// @route   PUT /api/trips/:id
// @access  Private
exports.updateTrip = asyncHandler(async (req, res) => {
  let trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权修改此行程', 403);
  }
  
  trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: trip
  });
});

// @desc    删除行程
// @route   DELETE /api/trips/:id
// @access  Private
exports.deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权删除此行程', 403);
  }
  
  await trip.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    获取行程交通建议
// @route   GET /api/trips/:id/transport
// @access  Private
exports.getTripTransport = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权访问此行程', 403);
  }
  
  const transportData = {
    origin: req.query.origin || '北京', // 默认出发地
    destination: trip.destination,
    departureDate: trip.startDate,
    returnDate: trip.endDate,
    budget: trip.budget,
    preferredMode: req.query.preferredMode || '所有',
    passengers: req.query.passengers || 1,
    specialRequirements: trip.specialRequirements
  };
  
  const transportRecommendations = await transportAgent.getTransportRecommendations(transportData);
  
  res.status(200).json({
    success: true,
    data: transportRecommendations
  });
});

// @desc    获取行程住宿推荐
// @route   GET /api/trips/:id/accommodation
// @access  Private
exports.getTripAccommodation = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权访问此行程', 403);
  }
  
  const accommodationData = {
    destination: trip.destination,
    checkIn: trip.startDate,
    checkOut: trip.endDate,
    budget: trip.budget,
    accommodationType: req.query.accommodationType || '所有',
    travelPurpose: trip.travelStyle,
    guests: req.query.guests || 1,
    specialRequirements: trip.specialRequirements
  };
  
  const accommodationRecommendations = await accommodationAgent.getAccommodationRecommendations(accommodationData);
  
  res.status(200).json({
    success: true,
    data: accommodationRecommendations
  });
});

// @desc    获取行程活动推荐
// @route   GET /api/trips/:id/activities
// @access  Private
exports.getTripActivities = asyncHandler(async (req, res) => {
  const foodActivityAgent = require('../services/agents/foodActivityAgent');
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权访问此行程', 403);
  }
  
  const activityData = {
    destination: trip.destination,
    date: req.query.date || trip.startDate,
    time: req.query.time || '上午',
    budget: trip.budget,
    interests: trip.interests,
    activityType: req.query.activityType || '所有',
    people: req.query.people || 1
  };
  
  const activityRecommendations = await foodActivityAgent.getActivityRecommendations(activityData);
  
  res.status(200).json({
    success: true,
    data: activityRecommendations
  });
});

// @desc    获取行程美食推荐
// @route   GET /api/trips/:id/food
// @access  Private
exports.getTripFood = asyncHandler(async (req, res) => {
  const foodActivityAgent = require('../services/agents/foodActivityAgent');
  const trip = await Trip.findById(req.params.id);
  
  if (!trip) {
    throw new AppError('未找到行程', 404);
  }
  
  // 检查行程所有权
  if (trip.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('无权访问此行程', 403);
  }
  
  const foodData = {
    destination: trip.destination,
    date: req.query.date || trip.startDate,
    time: req.query.time || '晚上',
    budget: trip.budget,
    cuisinePreferences: req.query.cuisinePreferences || trip.interests.filter(i => i === '美食').length > 0 ? '当地特色' : '多样化',
    dietaryRestrictions: req.query.dietaryRestrictions || '无',
    people: req.query.people || 1,
    occasion: req.query.occasion || '休闲'
  };
  
  const foodRecommendations = await foodActivityAgent.getRestaurantRecommendations(foodData);
  
  res.status(200).json({
    success: true,
    data: foodRecommendations
  });
});