const { asyncHandler } = require('../utils/helpers');
const AppError = require('../utils/appError');
const masterAgentService = require('../services/agents/masterAgentService');

// @desc    处理用户查询并调用相应的Agent
// @route   POST /api/agent/query
// @access  Private
exports.processUserQuery = asyncHandler(async (req, res) => {
  const { query, tripId, context } = req.body;
  
  if (!query) {
    throw new AppError('请提供查询内容', 400);
  }
  
  // 使用主控Agent处理用户查询
  const response = await masterAgentService.processQuery(query, tripId, context, req.user.id);
  
  res.status(200).json({
    success: true,
    data: response
  });
});

// @desc    获取对话历史
// @route   GET /api/agent/history
// @access  Private
exports.getConversationHistory = asyncHandler(async (req, res) => {
  const { tripId } = req.query;
  
  const history = await masterAgentService.getConversationHistory(req.user.id, tripId);
  
  res.status(200).json({
    success: true,
    data: history
  });
});

// @desc    清除对话历史
// @route   DELETE /api/agent/history
// @access  Private
exports.clearConversationHistory = asyncHandler(async (req, res) => {
  const { tripId } = req.body;
  
  await masterAgentService.clearConversationHistory(req.user.id, tripId);
  
  res.status(200).json({
    success: true,
    message: '对话历史已清除'
  });
});