const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const hotelService = require('../external/hotelService');
const logger = require('../../utils/logger');

// 住宿推荐提示模板
const accommodationPrompt = PromptTemplate.fromTemplate(`
你是一个专业的住宿顾问。请根据以下信息为用户推荐最适合的住宿选择：

目的地: {destination}
入住日期: {checkIn}
退房日期: {checkOut}
预算: {budget}
住宿类型偏好: {accommodationType}
旅行目的: {travelPurpose}
人数: {guests}
特殊要求: {specialRequirements}
可用的住宿选项: {availableOptions}

请考虑位置、价格、设施、评价和特殊需求，提供详细的住宿建议。
`);

class AccommodationAgent {
  constructor() {
    this.model = createOpenAIModel(0.7);
    this.chain = new LLMChain({
      llm: this.model,
      prompt: accommodationPrompt,
    });
  }

  async getAccommodationRecommendations(accommodationData) {
    try {
      // 获取实时住宿信息
      const availableOptions = await hotelService.searchHotels(
        accommodationData.destination,
        accommodationData.checkIn,
        accommodationData.checkOut,
        accommodationData.guests,
        accommodationData.accommodationType
      );
      
      const result = await this.chain.call({
        ...accommodationData,
        availableOptions: JSON.stringify(availableOptions.slice(0, 10)), // 限制选项数量
      });
      
      return {
        success: true,
        recommendations: result.text,
        options: availableOptions.slice(0, 10),
      };
    } catch (error) {
      logger.error(`住宿推荐生成失败: ${error.message}`);
      return {
        success: false,
        error: '住宿推荐生成失败，请稍后重试',
      };
    }
  }

  async getAccommodationDetails(accommodationId) {
    try {
      const details = await hotelService.getHotelDetails(accommodationId);
      
      return {
        success: true,
        details,
      };
    } catch (error) {
      logger.error(`获取住宿详情失败: ${error.message}`);
      return {
        success: false,
        error: '获取住宿详情失败，请稍后重试',
      };
    }
  }
}

module.exports = new AccommodationAgent();