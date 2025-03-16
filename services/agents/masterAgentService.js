const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const logger = require('../../utils/logger');
const Trip = require('../../models/Trip');
const Conversation = require('../../models/Conversation');
const tripPlannerAgent = require('./tripPlannerAgent');
const transportAgent = require('./transportAgent');
const accommodationAgent = require('./accommodationAgent');
const translationAgent = require('./translationAgent');
const foodActivityAgent = require('./foodActivityAgent');

// 意图识别提示模板
const intentPrompt = PromptTemplate.fromTemplate(`
你是一个旅行助手的意图识别系统。请分析用户的查询，并确定最适合处理该查询的专业代理。

用户查询: {query}
旅行上下文: {context}

请从以下选项中选择最合适的代理:
1. 行程规划代理 - 负责创建和修改旅行计划
2. 交通助手代理 - 提供交通工具建议和信息
3. 住宿推荐代理 - 推荐酒店和住宿选择
4. 翻译代理 - 提供语言翻译服务
5. 美食与活动助手 - 推荐餐厅和活动

仅返回代理编号(1-5)和简短理由，格式如下:
代理: [代理编号]
理由: [简短解释]
`);

class MasterAgentService {
  constructor() {
    this.model = createOpenAIModel(0.3); // 低温度以确保准确的意图识别
    this.intentChain = new LLMChain({
      llm: this.model,
      prompt: intentPrompt,
    });
    
    // 创建对话模型
    this.conversationModel = createOpenAIModel(0.7);
    
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

  async processQuery(query, tripId, context = {}, userId) {
    try {
      // 获取行程信息（如果提供了tripId）
      let tripContext = '';
      if (tripId) {
        const trip = await Trip.findById(tripId);
        if (trip && trip.user.toString() === userId) {
          tripContext = `目的地: ${trip.destination}, 开始日期: ${trip.startDate}, 结束日期: ${trip.endDate}, 预算: ${trip.budget}, 兴趣: ${trip.interests.join(', ')}, 旅行风格: ${trip.travelStyle}`;
        }
      }
      
      // 合并上下文
      const fullContext = {
        ...context,
        tripInfo: tripContext
      };
      
      // 识别用户意图
      const intentResult = await this.intentChain.call({
        query,
        context: JSON.stringify(fullContext)
      });
      
      // 解析意图结果
      const intentText = intentResult.text;
      const agentMatch = intentText.match(/代理:\s*(\d+)/);
      const reasonMatch = intentText.match(/理由:\s*(.+)/);
      
      if (!agentMatch) {
        // 如果无法识别明确的意图，使用通用回复
        return this.generateGenericResponse(query, fullContext);
      }
      
      const agentId = parseInt(agentMatch[1]);
      const reason = reasonMatch ? reasonMatch[1] : '未提供理由';
      
      logger.info(`用户查询: "${query}" 被路由到 ${this.agentNames[agentId]} (理由: ${reason})`);
      
      // 调用相应的代理
      let response;
      switch (agentId) {
        case 1: // 行程规划代理
          response = await this.handleTripPlanningQuery(query, tripId, fullContext, userId);
          break;
        case 2: // 交通助手代理
          response = await this.handleTransportQuery(query, tripId, fullContext, userId);
          break;
        case 3: // 住宿推荐代理
          response = await this.handleAccommodationQuery(query, tripId, fullContext, userId);
          break;
        case 4: // 翻译代理
          response = await this.handleTranslationQuery(query, fullContext);
          break;
        case 5: // 美食与活动助手
          response = await this.handleFoodActivityQuery(query, tripId, fullContext, userId);
          break;
        default:
          response = await this.generateGenericResponse(query, fullContext);
      }
      
      // 保存对话历史
      await this.saveConversation(userId, tripId, query, response);
      
      return {
        response,
        agentUsed: this.agentNames[agentId],
        confidence: 0.8 // 模拟置信度
      };
    } catch (error) {
      logger.error(`处理用户查询失败: ${error.message}`);
      return {
        response: '抱歉，我在处理您的请求时遇到了问题。请稍后再试。',
        error: error.message
      };
    }
  }
  
  // 处理行程规划查询
  async handleTripPlanningQuery(query, tripId, context, userId) {
    // 这里可以根据查询内容调用tripPlannerAgent的不同方法
    // 简化示例：
    if (query.includes('创建') || query.includes('规划') || query.includes('新的行程')) {
      // 解析查询中的行程信息
      // 实际实现中应该使用更复杂的NLP来提取实体
      const destination = this.extractDestination(query);
      if (destination) {
        return `我可以帮您规划前往${destination}的行程。请提供您的旅行日期和预算，以便我为您创建详细的行程计划。`;
      } else {
        return '我很乐意帮您规划行程。请告诉我您想去哪里，什么时候出发，以及您的预算是多少？';
      }
    } else if (query.includes('修改') || query.includes('更新')) {
      return '您想修改现有行程吗？请告诉我您想更改哪些部分，例如日期、目的地或活动安排。';
    } else {
      // 默认回复
      return '我是您的行程规划助手。我可以帮您创建新的旅行计划，或修改现有的行程。请告诉我您需要什么帮助？';
    }
  }
  
  // 处理交通查询
  async handleTransportQuery(query, tripId, context, userId) {
    if (query.includes('航班') || query.includes('飞机')) {
      return '我可以帮您查找航班信息。请提供出发地、目的地和日期，我会为您推荐最合适的航班选择。';
    } else if (query.includes('火车') || query.includes('高铁')) {
      return '我可以帮您查询火车或高铁信息。请提供出发站、到达站和日期，我会为您找到合适的车次。';
    } else if (query.includes('出租车') || query.includes('打车')) {
      return '在目的地，您可以使用出租车或网约车服务。我可以为您提供当地常用的打车应用和估计费用。';
    } else {
      return '作为您的交通助手，我可以帮您规划从出发地到目的地的交通方式，包括航班、火车、公交等。您需要什么具体的交通信息？';
    }
  }
  
  // 处理住宿查询
  async handleAccommodationQuery(query, tripId, context, userId) {
    if (query.includes('酒店') || query.includes('住宿')) {
      // 从上下文中提取目的地
      const destination = context.tripInfo ? context.tripInfo.match(/目的地:\s*([^,]+)/) : null;
      const dest = destination ? destination[1] : '您的目的地';
      
      return `我可以为您在${dest}推荐适合的住宿。请告诉我您的预算范围、偏好的住宿类型（如酒店、民宿或公寓）以及您看重的设施（如游泳池、健身房等）。`;
    } else if (query.includes('民宿') || query.includes('公寓')) {
      return '民宿和公寓通常提供更多的空间和家的感觉。您是独自旅行还是与家人/朋友一起？这将帮助我为您找到最合适的选择。';
    } else {
      return '作为住宿推荐专家，我可以根据您的预算和偏好为您推荐最适合的住宿选择。您对住宿有什么特别的要求吗？';
    }
  }
  
  // 处理翻译查询
  async handleTranslationQuery(query, context) {
    if (query.includes('翻译')) {
      const textToTranslate = query.replace(/.*翻译[：:]\s*/, '').replace(/.*翻译\s+/, '');
      if (textToTranslate && textToTranslate !== query) {
        // 检测语言并翻译
        // 简化示例，实际应调用translationAgent
        return `原文: ${textToTranslate}\n翻译: [这里将是翻译结果]`;
      } else {
        return '我可以帮您翻译文本。请按以下格式提供需要翻译的内容：\n"翻译: [您的文本]"';
      }
    } else if (query.includes('怎么说')) {
      return '您想知道某个词或短语在其他语言中怎么说吗？请告诉我您想翻译的词语和目标语言。';
    } else {
      return '我是您的翻译助手，可以帮您翻译文本或提供常用旅行短语。您需要什么样的翻译帮助？';
    }
  }
  
  // 处理美食与活动查询
  async handleFoodActivityQuery(query, tripId, context, userId) {
    if (query.includes('餐厅') || query.includes('吃什么') || query.includes('美食')) {
      // 从上下文中提取目的地
      const destination = context.tripInfo ? context.tripInfo.match(/目的地:\s*([^,]+)/) : null;
      const dest = destination ? destination[1] : '您的目的地';
      
      return `我可以为您在${dest}推荐当地特色美食和餐厅。您有任何饮食偏好或限制吗？例如，您是否喜欢辣食、素食或有任何食物过敏？`;
    } else if (query.includes('活动') || query.includes('景点') || query.includes('玩什么')) {
      const destination = context.tripInfo ? context.tripInfo.match(/目的地:\s*([^,]+)/) : null;
      const dest = destination ? destination[1] : '您的目的地';
      
      return `${dest}有许多精彩的活动和景点。您对历史文化、自然风光、冒险体验或购物更感兴趣？这将帮助我为您推荐最适合的活动。`;
    } else {
      return '作为美食与活动助手，我可以为您推荐当地特色餐厅和有趣的活动。您对什么类型的美食或活动更感兴趣？';
    }
  }
  
  // 生成通用回复
  async generateGenericResponse(query, context) {
    // 使用更通用的对话模型生成回复
    const genericPrompt = PromptTemplate.fromTemplate(`
      你是一个友好的旅行助手。请回答用户的问题:
      
      用户问题: {query}
      上下文信息: {context}
      
      请提供有帮助、友好且信息丰富的回答。如果你不确定，请诚实地说明并提供一般性建议。
    `);
    
    const genericChain = new LLMChain({
      llm: this.conversationModel,
      prompt: genericPrompt,
    });
    
    const result = await genericChain.call({
      query,
      context: JSON.stringify(context)
    });
    
    return result.text;
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