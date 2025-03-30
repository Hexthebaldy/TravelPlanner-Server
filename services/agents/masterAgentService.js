const { PromptTemplate } = require('langchain/prompts');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const { ChatDeepSeek } = require('@langchain/deepseek');
const logger = require('../../utils/logger');
const Trip = require('../../models/Trip');
const Conversation = require('../../models/Conversation');
const tripPlannerAgent = require('./tripPlannerAgent');
const transportAgent = require('./transportAgent');
const accommodationAgent = require('./accommodationAgent');
const translationAgent = require('./translationAgent');
const foodActivityAgent = require('./foodActivityAgent');

class MasterAgentService {
  constructor() {
    this.llm = new ChatDeepSeek({
      model: "deepseek-chat",
      temperature: 0,
    });
    
    // 代理映射
    this.agentMap = {
      1: tripPlannerAgent,
      2: transportAgent,
      3: accommodationAgent,
      4: translationAgent,
      5: foodActivityAgent
    };
    
    // 代理名称映射
    this.agentNames = {
      1: '行程规划代理',
      2: '交通助手代理',
      3: '住宿推荐代理',
      4: '翻译代理',
      5: '美食与活动助手'
    };
  }
  
  // 生成通用回复
  async generateGenericResponse(query) {
    try {
      // 构建提示信息
      const promptText = `
        你是一个友好的旅行助手。请回答用户的问题:
        
        用户问题: ${query}
        
        从用户的问题中提炼出目的地，旅行天数，预算，如果有特殊需求请带上特殊需求。以JSON格式的纯文本返回响应。

        示例响应:
      {
        "destination": "paris",
        "duration": 7,
        "budget": "20k rmb",
        "specialRequirements": "visit the Eiffel Tower"
      }
      `;
      
      // 直接调用模型
      const response = await this.llm.invoke(promptText);
      console.log('response: ',response);
      // 保存对话历史
      this.saveConversation('0001', '0001', query, response.content);

      // 解析响应 - 修复JSON解析问题
      let jsonContent = response.content;
      // 移除可能存在的Markdown代码块标记
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const requirements = JSON.parse(jsonContent);
      console.log('#requirements: ',requirements);

      //创建tripPlannerAgent
      const tripPlanner = new this.agentMap[1](requirements.destination, requirements.duration, requirements.budget, requirements.specialRequirements);

      // 生成行程计划
      const tripPlan = await tripPlanner.generateTripPlan();
      
      return tripPlan || '抱歉，我无法处理您的请求。';
    } catch (error) {
      logger.error(`生成通用回复失败: ${error.message}`);
      return '抱歉，我暂时无法回答您的问题。请稍后再试或提供更多信息。';
    }
  }
  
  // 提取目的地（简化示例）
  extractDestination(query) {
    const destinations = ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '三亚', '丽江', '香港', '澳门', '台北', '东京', '大阪', '首尔', '曼谷', '新加坡', '巴黎', '伦敦', '纽约', '洛杉矶', '悉尼'];
    
    for (const dest of destinations) {
      if (query.includes(dest)) {
        return dest;
      }
    }
    
    return null;
  }
  
  // 保存对话历史
  async saveConversation(userId, tripId, query, response) {
    try {
      console.log('creating record ...');
      await Conversation.create({
        user: userId,
        trip: tripId,
        query,
        response,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`保存对话历史失败: ${error.message}`);
    }
  }
  
  // 获取对话历史
  async getConversationHistory(userId, tripId) {
    try {
      const query = { user: userId };
      if (tripId) {
        query.trip = tripId;
      }
      
      return await Conversation.find(query)
        .sort({ timestamp: 1 })
        .select('query response timestamp');
    } catch (error) {
      logger.error(`获取对话历史失败: ${error.message}`);
      throw new AppError('无法获取对话历史', 500);
    }
  }
  
  // 清除对话历史
  async clearConversationHistory(userId, tripId) {
    try {
      const query = { user: userId };
      if (tripId) {
        query.trip = tripId;
      }
      
      await Conversation.deleteMany(query);
    } catch (error) {
      logger.error(`清除对话历史失败: ${error.message}`);
      throw new AppError('无法清除对话历史', 500);
    }
  }
}

module.exports = new MasterAgentService();