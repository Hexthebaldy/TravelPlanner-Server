const { OpenAI } = require('langchain/llms/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');

// 创建OpenAI模型实例,temperature越大,生成的文本越随机
// Create an instance of the OpenAI model with a temperature of 0.7
const createOpenAIModel = (temperature = 0.7) => {
  return new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature,
    modelName: 'gpt-4', // 或其他适合的模型 or other suitable model
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