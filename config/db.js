const mongoose = require('mongoose');
const logger = require('../utils/logger');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true, // 使用新的URL解析器 
      useUnifiedTopology: true, // 使用新的服务器发现和监视引擎
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;