const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/helpers').asyncHandler;
const AppError = require('../utils/appError');
const User = require('../models/User');

// 保护路由
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // 从请求头或cookie中获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // 检查token是否存在
  if (!token) {
    return next(new AppError('未授权访问', 401));
  }
  
  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户是否存在
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new AppError('找不到拥有此token的用户', 401));
    }
    
    // 将用户添加到请求对象
    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('未授权访问', 401));
  }
});

// 授权角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('该角色无权执行此操作', 403));
    }
    next();
  };
};