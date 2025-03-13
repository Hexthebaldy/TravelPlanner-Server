// 服务器入口文件 server entrance file
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// 环境变量 environment variables
const PORT = process.env.PORT || 3000;

// 连接数据库 connect database
connectDB();

// 启动服务器 start server
const server = app.listen(PORT, () => {
  logger.info(`server is running at port: ${PORT}`);
});

// 处理未捕获的异常 handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('uncaught exception', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝 handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('unhandled rejection', err);
  server.close(() => {
    process.exit(1);
  });
});