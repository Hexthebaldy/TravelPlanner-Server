const express = require('express');
const {
  processUserQuery,
  getConversationHistory,
  clearConversationHistory,
  generateResponse
} = require('../controllers/masterAgentController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 所有路由都需要认证
// router.use(protect);

// 处理用户查询
router.post('/query', processUserQuery);

// 对话历史管理
router.get('/history', getConversationHistory);
router.delete('/history', clearConversationHistory);

// 生成通用回复
router.post('/response', generateResponse);

module.exports = router;