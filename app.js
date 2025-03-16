const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 路由导入 import routes
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const agentRoutes = require('./routes/agentRoutes');
const userRoutes = require('./routes/userRoutes');
const apiRoutes = require('./routes/apiRoutes');

// 中间件导入 import middleware
const errorMiddleware = require('./middleware/errorMiddleware');
const { loggerMiddleware } = require('./middleware/loggingMiddleware');

// 加载环境变量 load environment variables
dotenv.config();

const app = express();

// 基础中间件 base middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(loggerMiddleware);

// API路由 API routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// 健康检查 test api
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理中间件 error handling middleware
app.use(errorMiddleware);

module.exports = app;