const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// @desc    注册用户
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('邮箱已被注册', 400);
  }
  
  // 创建用户
  const user = await User.create({
    name,
    email,
    password
  });
  
  // 发送令牌
  sendTokenResponse(user, 201, res);
});

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // 验证邮箱和密码
  if (!email || !password) {
    throw new AppError('请提供邮箱和密码', 400);
  }
  
  // 检查用户
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError('无效的凭据', 401);
  }
  
  // 检查密码
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw new AppError('无效的凭据', 401);
  }
  
  // 发送令牌
  sendTokenResponse(user, 200, res);
});

// @desc    用户登出
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    获取当前登录用户
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    更新用户详情
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };
  
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    更新密码
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  
  // 检查当前密码
  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new AppError('密码不正确', 401);
  }
  
  user.password = req.body.newPassword;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});

// @desc    忘记密码
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    throw new AppError('没有使用该邮箱的用户', 404);
  }
  
  // 获取重置令牌
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // 哈希令牌并设置到resetPasswordToken字段
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // 设置过期时间 - 10分钟
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  await user.save({ validateBeforeSave: false });
  
  // 在实际应用中，这里应该发送包含重置链接的邮件
  // 这里简化处理，直接返回令牌
  
  res.status(200).json({
    success: true,
    resetToken
  });
});

// @desc    重置密码
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  // 获取哈希令牌
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new AppError('无效的令牌', 400);
  }
  
  // 设置新密码
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});

// 生成令牌并发送响应
const sendTokenResponse = (user, statusCode, res) => {
  // 创建令牌
  const token = user.getSignedJwtToken();
  
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};