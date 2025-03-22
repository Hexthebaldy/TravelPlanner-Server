const { OpenAI } = require('langchain/llms/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
require('dotenv').config();

// 创建DeepSeek模型实例（使用OpenAI兼容接口）
const createOpenAIModel = (temperature = 0.7) => {
  // 检查API密钥是否存在
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('DeepSeek API密钥未在环境变量中设置');
  }

  return new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'deepseek-chat', // DeepSeek模型名称
    temperature: temperature,
    maxTokens: 1000,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1', // DeepSeek API基础URL
    }
  });
};

// 创建基础对话链
const createConversationChain = (model) => {
  return new ConversationChain({
    llm: model, 
    memory: new BufferMemory(),// 存储对话历史 store conversation history
  });
};

module.exports = {
  createOpenAIModel,
  createConversationChain,
};