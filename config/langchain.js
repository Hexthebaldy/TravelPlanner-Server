const { OpenAI } = require('langchain/llms/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
require('dotenv').config();

// 创建OpenAI模型实例
const createOpenAIModel = (temperature = 0.7) => {
  // 检查API密钥是否存在
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API密钥未在环境变量中设置');
  }

  console.log('OpenAI API密钥已设置');

  // 使用自定义API服务
  return new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo', // OpenAI模型名称
    temperature: temperature,
    maxTokens: 1000,
    configuration: {
      baseURL: 'https://api.vveai.com/v1', 
    },
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