const { ChatDeepSeek } = require('@langchain/deepseek');
const mockPublicTransportService = require('../external/mockPublicTransportService');
const logger = require('../../utils/logger');

// 行程规划提示模板 trip planner prompt template

class TransportAgent {
  constructor(destination1,destination2) {
    const plans = mockPublicTransportService(destination1,destination2);
    this.llm = new ChatDeepSeek({
      model: "deepseek-chat",
      temperature: 0,
    });
    this.promptText = `
    你是一个专业的交通规划师。请根据以下信息为用户制定交通方案：
    起点: ${destination1},
    终点: ${destination2},
    交通方案：${plans}
  `
  }

  async generateTransportPlan() {
    try {
      console.log('#promptText: ',this.promptText);
      const response = await this.llm.invoke(this.promptText);
      console.log('response context: ',response.content);
      return response.content || 'handle error'
    } catch (error) {
      logger.error(`planning transport failed: ${error.message}`);
      return {
        success: false,
        error: 'failed to generate transport plan, try again later',
      };
    }
  }
}

module.exports = TransportAgent;