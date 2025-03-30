const { ChatDeepSeek } = require('@langchain/deepseek');
const logger = require('../../utils/logger');

// 行程规划提示模板 trip planner prompt template

class TripPlannerAgent {
  constructor(destination, duration, budget, specialRequirements) {
    this.llm = new ChatDeepSeek({
      model: "deepseek-chat",
      temperature: 0,
    });
    this.promptText = `
    你是一个专业的旅行规划师。请根据以下信息为用户制定最优旅行路线：

    目的地: ${destination}
    旅行时间: ${duration} 天
    预算: ${budget}
    特殊要求: ${specialRequirements}

    请提供详细的日程安排，包括景点游览、用餐建议、交通安排等。
  `
  }

  //优化空间：参数校验
  async generateTripPlan() {
    try {
      const response = await this.llm.invoke(promptText);
      
      return response.content || 'handle error'
    } catch (error) {
      logger.error(`planning trip failed: ${error.message}`);
      return {
        success: false,
        error: 'failed to generate plan, try again later',
      };
    }
  }
}

module.exports = TripPlannerAgent();