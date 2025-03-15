const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // 记录错误
  logger.error(err);
  
  // Mongoose错误处理
  if (err.name === 'CastError') {
    const message = `资源未找到`;
    error = new AppError(message, 404);
  }
  
  if (err.code === 11000) {
    const message = '存在重复字段值';
    error = new AppError(message, 400);
  }
  
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '服务器错误'
  });
};

module.exports = errorHandler;