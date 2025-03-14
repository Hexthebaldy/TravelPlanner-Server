const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const logger = require('../../utils/logger');

// 行程规划提示模板 trip planner prompt template
const tripPlannerPrompt = PromptTemplate.fromTemplate(`
你是一个专业的旅行规划师。请根据以下信息为用户制定最优旅行路线：

目的地: {destination}
旅行时间: {duration} 天
预算: {budget}
兴趣点: {interests}
旅行风格: {travelStyle}
特殊要求: {specialRequirements}

请提供详细的日程安排，包括景点游览、用餐建议、交通安排等。
`);

class TripPlannerAgent {
  constructor() {
    this.model = createOpenAIModel(0.7);
    this.chain = new LLMChain({
      llm: this.model,
      prompt: tripPlannerPrompt,
    });
  }

  //优化空间：参数校验
  async generateTripPlan(tripData) {
    try {
      const { destination, duration, budget, interests, travelStyle, specialRequirements } = tripData;
      
      const result = await this.chain.call({
        destination,
        duration,
        budget,
        interests: interests.join(', '),
        travelStyle,
        specialRequirements: specialRequirements || '无',
      }); // 调用链 call the chain 将用户输入传递给链 
      
      return {
        success: true,
        plan: result.text,
      };
    } catch (error) {
      logger.error(`planning trip failed: ${error.message}`);
      return {
        success: false,
        error: 'failed to generate plan, try again later',
      };
    }
  }
}

module.exports = new TripPlannerAgent();